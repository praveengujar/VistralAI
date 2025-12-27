import 'next-auth';
import { OrganizationRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      accountType: string;
      // Organization context (if user belongs to one)
      organizationId?: string;
      organizationName?: string;
      organizationRole?: OrganizationRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    accountType: string;
    mfaEnabled?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accountType: string;
    provider?: string;
    // Organization context
    organizationId?: string;
    organizationName?: string;
    organizationRole?: OrganizationRole;
  }
}
