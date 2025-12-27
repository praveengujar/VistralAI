import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/db/prisma';
import { getUserByEmail, verifyPassword } from '@/lib/db';
import { createAuditLog } from '@/lib/services/audit';

// Check if OAuth providers are configured
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const isGitHubConfigured = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

// Build providers array dynamically based on what's configured
const providers: NextAuthOptions['providers'] = [
  // Credentials provider (always available)
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      mfaCode: { label: 'MFA Code', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Invalid credentials');
      }

      const user = await getUserByEmail(credentials.email);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has a password (OAuth users may not have one)
      if (!user.password) {
        throw new Error('Please sign in with your OAuth provider');
      }

      const isPasswordValid = await verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // TODO: Check for MFA if enabled
      // This will be implemented when MFA is added
      // if (user.mfaEnabled && !credentials.mfaCode) {
      //   throw new Error('MFA_REQUIRED');
      // }

      return {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
      };
    },
  }),
];

// Add Google provider if configured
if (isGoogleConfigured) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Add GitHub provider if configured
if (isGitHubConfigured) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  // Use PrismaAdapter for OAuth account linking
  // Note: This enables database sessions for OAuth but we override to JWT
  adapter: PrismaAdapter(prisma) as any,

  providers,

  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth sign-ins without additional checks for now
      if (account?.provider !== 'credentials') {
        return true;
      }
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.accountType = (user as any).accountType || 'brand';
        token.provider = account?.provider;
      }

      // Session update (e.g., after profile update)
      if (trigger === 'update') {
        // Re-fetch user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { organization: true },
              take: 1,
            },
          },
        });

        if (dbUser) {
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.accountType = dbUser.accountType;

          // Add organization context if user belongs to one
          if (dbUser.memberships.length > 0) {
            const membership = dbUser.memberships[0];
            token.organizationId = membership.organizationId;
            token.organizationName = membership.organization.name;
            token.organizationRole = membership.role;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as string;

        // Add organization context to session
        if (token.organizationId) {
          (session.user as any).organizationId = token.organizationId;
          (session.user as any).organizationName = token.organizationName;
          (session.user as any).organizationRole = token.organizationRole;
        }
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/error',
    // newUser: '/onboarding', // Redirect new users to onboarding
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Update last login timestamp
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {
          // Silently fail if user doesn't exist yet (OAuth first sign-in)
        });
      }

      // Log sign-in event to audit log
      await createAuditLog({
        action: isNewUser ? 'user.register' : 'user.login',
        category: 'AUTH',
        status: 'SUCCESS',
        userId: user.id ?? undefined,
        userEmail: user.email ?? undefined,
        description: `User ${isNewUser ? 'registered' : 'signed in'} via ${account?.provider}`,
        metadata: {
          provider: account?.provider,
          isNewUser,
        },
      }).catch((err) => {
        console.error('[Auth] Failed to create audit log:', err);
      });

      console.log(`[Auth] User signed in: ${user.email} via ${account?.provider}, isNew: ${isNewUser}`);
    },
  },

  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',

  debug: process.env.NODE_ENV === 'development',
};

// Export helper to check available providers
export const getAvailableProviders = () => ({
  credentials: true,
  google: isGoogleConfigured,
  github: isGitHubConfigured,
});
