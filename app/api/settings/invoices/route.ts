// GET /api/settings/invoices - Get invoice history

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';
import { StripeService } from '@/lib/services/payments/StripeService';

const stripeService = new StripeService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invoices from database
    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      orderBy: { invoiceDate: 'desc' },
      take: 20,
    });

    // If we have Stripe customer ID, also fetch from Stripe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    let stripeInvoices: any[] = [];
    if (user?.stripeCustomerId) {
      try {
        stripeInvoices = await stripeService.listInvoices(user.stripeCustomerId, 20);
      } catch (error) {
        console.error('Error fetching Stripe invoices:', error);
        // Continue without Stripe invoices
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        stripeInvoices: stripeInvoices.map((inv: any) => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          total: inv.total,
          currency: inv.currency,
          date: new Date(inv.created * 1000),
          pdfUrl: inv.invoice_pdf,
          hostedUrl: inv.hosted_invoice_url,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
