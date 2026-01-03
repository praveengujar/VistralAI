// API Route: POST /api/onboarding/profile
// Run Magic Import during onboarding (Step 4 - Build Profile)
// This analyzes the website and creates the Brand360 profile

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import { MagicImportOrchestrator } from '@/lib/services/agents/MagicImportOrchestrator';
import prisma from '@/lib/db/prisma';

// Singleton orchestrator instance
const magicImportOrchestrator = new MagicImportOrchestrator();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Get onboarding session
    const onboardingSession = await onboardingService.getSessionByUserId(
      session.user.id
    );

    if (!onboardingSession) {
      return NextResponse.json(
        { success: false, error: 'No onboarding session found' },
        { status: 404 }
      );
    }

    // Verify payment step is complete (step 3)
    if (!onboardingSession.completedSteps.includes(3)) {
      return NextResponse.json(
        { success: false, error: 'Please complete payment first' },
        { status: 400 }
      );
    }

    // Verify brand info exists
    if (!onboardingSession.websiteUrl || !onboardingSession.brandName) {
      return NextResponse.json(
        { success: false, error: 'Missing brand information. Please complete brand setup first.' },
        { status: 400 }
      );
    }

    // Handle status check action
    if (action === 'status') {
      const brand360 = onboardingSession.brand360Id
        ? await prisma.brand360Profile.findUnique({
            where: { id: onboardingSession.brand360Id },
            select: {
              id: true,
              completionScore: true,
              entityHealthScore: true,
              lastAgentCrawlAt: true,
            },
          })
        : null;

      return NextResponse.json({
        success: true,
        data: {
          status: onboardingSession.brand360Id ? 'completed' : 'pending',
          brand360Id: onboardingSession.brand360Id,
          profile: brand360,
        },
      });
    }

    // If already completed, return the existing profile
    if (onboardingSession.brand360Id) {
      const existingProfile = await prisma.brand360Profile.findUnique({
        where: { id: onboardingSession.brand360Id },
        select: {
          id: true,
          completionScore: true,
          entityHealthScore: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          status: 'already_completed',
          brand360Id: onboardingSession.brand360Id,
          profile: existingProfile,
          message: 'Brand profile already exists. Proceeding to completion.',
        },
      });
    }

    // Log step start
    await onboardingService.logEvent(onboardingSession.id, 'step_started', {
      step: 4,
      stepName: 'profile',
      websiteUrl: onboardingSession.websiteUrl,
    });

    // Get or create organization for this user
    let organization = await prisma.organization.findFirst({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
    });

    if (!organization) {
      // Create organization for user
      organization = await prisma.organization.create({
        data: {
          name: onboardingSession.brandName,
          slug: onboardingSession.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          members: {
            create: {
              userId: session.user.id,
              role: 'owner',
            },
          },
        },
      });
    }

    // Execute Magic Import
    const result = await magicImportOrchestrator.execute(
      organization.id,
      onboardingSession.websiteUrl,
      onboardingSession.brandName,
      {
        maxPages: 20, // Limit for onboarding
        onProgress: (stage, progress, message) => {
          // In a production setup, this would emit WebSocket events
          // For now, we log progress
          console.log(`[Magic Import] ${stage}: ${progress}% - ${message}`);
        },
      }
    );

    // Update onboarding session with brand360Id
    await onboardingService.completeStep(
      onboardingSession.id,
      4,
      {
        brand360Id: result.brand360Id,
        metadata: {
          completionScore: result.completionScore,
          entityHealthScore: result.entityHealthScore,
          discoveries: result.discoveries,
          totalDuration: result.totalDuration,
        },
      }
    );

    // Log completion
    await onboardingService.logEvent(onboardingSession.id, 'step_completed', {
      step: 4,
      stepName: 'profile',
      brand360Id: result.brand360Id,
      completionScore: result.completionScore,
    });

    return NextResponse.json({
      success: true,
      data: {
        status: 'completed',
        brand360Id: result.brand360Id,
        completionScore: result.completionScore,
        entityHealthScore: result.entityHealthScore,
        discoveries: result.discoveries,
        stages: result.stages,
        totalDuration: result.totalDuration,
        nextStep: 5,
        message: 'Brand profile created successfully!',
      },
    });
  } catch (error) {
    console.error('Error processing build profile:', error);

    // Log error to onboarding session if we have one
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const onboardingSession = await onboardingService.getSessionByUserId(
          session.user.id
        );
        if (onboardingSession) {
          await onboardingService.logError(
            onboardingSession.id,
            4,
            error instanceof Error ? error.message : 'Unknown error',
            { stack: error instanceof Error ? error.stack : undefined }
          );
        }
      }
    } catch {
      // Ignore logging errors
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check profile status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const onboardingSession = await onboardingService.getSessionByUserId(
      session.user.id
    );

    if (!onboardingSession) {
      return NextResponse.json(
        { success: false, error: 'No onboarding session found' },
        { status: 404 }
      );
    }

    const brand360 = onboardingSession.brand360Id
      ? await prisma.brand360Profile.findUnique({
          where: { id: onboardingSession.brand360Id },
          select: {
            id: true,
            completionScore: true,
            entityHealthScore: true,
            lastAgentCrawlAt: true,
            lastAnalyzedAt: true,
          },
        })
      : null;

    return NextResponse.json({
      success: true,
      data: {
        websiteUrl: onboardingSession.websiteUrl,
        brandName: onboardingSession.brandName,
        brand360Id: onboardingSession.brand360Id,
        completed: onboardingSession.completedSteps.includes(4),
        profile: brand360,
      },
    });
  } catch (error) {
    console.error('Error getting profile status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile status' },
      { status: 500 }
    );
  }
}
