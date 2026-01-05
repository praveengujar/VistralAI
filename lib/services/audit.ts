import prisma from '@/lib/db/prisma';

// JSON value type for metadata (replaces Prisma.InputJsonValue to avoid build-time dependency)
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Type for audit log record returned from Prisma
interface AuditLogRecord {
  id: string;
  action: string;
  category: string;
  status: string;
  userId: string | null;
  userEmail: string | null;
  organizationId: string | null;
  targetType: string | null;
  targetId: string | null;
  description: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
  createdAt: Date;
}

// Audit log action types
export type AuditAction =
  // Authentication
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_change'
  | 'user.password_reset'
  | 'user.mfa_enabled'
  | 'user.mfa_disabled'
  | 'user.mfa_verified'
  | 'user.session_revoked'
  // User
  | 'user.profile_update'
  | 'user.avatar_upload'
  | 'user.settings_update'
  | 'user.deleted'
  // Organization
  | 'org.created'
  | 'org.updated'
  | 'org.member_invited'
  | 'org.member_joined'
  | 'org.member_role_changed'
  | 'org.member_removed'
  | 'org.invitation_revoked'
  | 'org.invitation_resent'
  | 'org.ownership_transferred'
  // Brand
  | 'brand.created'
  | 'brand.updated'
  | 'brand.deleted'
  | 'brand.website_analyzed'
  | 'brand.document_uploaded'
  | 'brand.catalog_imported'
  // API Keys
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.used'
  // Security
  | 'security.suspicious_activity'
  | 'security.rate_limit_exceeded'
  | 'security.unauthorized_access';

// Audit categories (matches Prisma enum)
export type AuditCategory = 'AUTH' | 'USER' | 'ORGANIZATION' | 'BRAND' | 'SECURITY' | 'BILLING' | 'SYSTEM';

// Audit status (matches Prisma enum)
export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING';

// Audit log entry interface
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  category: AuditCategory;
  status: AuditStatus;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  timestamp: Date;
}

// Input for creating an audit log
export interface CreateAuditLogInput {
  action: AuditAction;
  category: AuditCategory;
  status?: AuditStatus;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  targetType?: string;
  targetId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}

// Filters for querying audit logs
export interface AuditLogFilters {
  userId?: string;
  organizationId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  status?: AuditStatus;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  const {
    action,
    category,
    status = 'SUCCESS',
    userId,
    userEmail,
    organizationId,
    targetType,
    targetId,
    description,
    metadata,
    ipAddress,
    userAgent,
    errorMessage,
  } = input;

  try {
    const log = await prisma.auditLog.create({
      data: {
        action,
        category,
        status,
        userId,
        userEmail,
        organizationId,
        targetType,
        targetId,
        description,
        metadata: (metadata ?? {}) as JsonValue,
        ipAddress,
        userAgent,
        errorMessage,
      },
    });

    return {
      id: log.id,
      action: log.action as AuditAction,
      category: log.category as AuditCategory,
      status: log.status as AuditStatus,
      userId: log.userId ?? undefined,
      userEmail: log.userEmail ?? undefined,
      organizationId: log.organizationId ?? undefined,
      targetType: log.targetType ?? undefined,
      targetId: log.targetId ?? undefined,
      description: log.description ?? undefined,
      metadata: log.metadata as Record<string, unknown> | undefined,
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      errorMessage: log.errorMessage ?? undefined,
      timestamp: log.createdAt,
    };
  } catch (error) {
    // Log to console as fallback if database write fails
    console.error('[AUDIT LOG ERROR]', error);
    console.log('[AUDIT LOG FALLBACK]', {
      action,
      category,
      status,
      userId,
      organizationId,
      targetType,
      targetId,
      description,
      timestamp: new Date().toISOString(),
    });

    // Return a mock entry so the caller doesn't fail
    return {
      id: 'fallback-' + Date.now(),
      action,
      category,
      status,
      userId,
      userEmail,
      organizationId,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress,
      userAgent,
      errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: AuditLogFilters): Promise<{
  logs: AuditLogEntry[];
  total: number;
}> {
  const {
    userId,
    organizationId,
    action,
    category,
    status,
    targetType,
    targetId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;
  if (organizationId) where.organizationId = organizationId;
  if (action) where.action = action;
  if (category) where.category = category;
  if (status) where.status = status;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log: AuditLogRecord) => ({
        id: log.id,
        action: log.action as AuditAction,
        category: log.category as AuditCategory,
        status: log.status as AuditStatus,
        userId: log.userId ?? undefined,
        userEmail: log.userEmail ?? undefined,
        organizationId: log.organizationId ?? undefined,
        targetType: log.targetType ?? undefined,
        targetId: log.targetId ?? undefined,
        description: log.description ?? undefined,
        metadata: log.metadata as Record<string, unknown> | undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        errorMessage: log.errorMessage ?? undefined,
        timestamp: log.createdAt,
      })),
      total,
    };
  } catch (error) {
    console.error('[AUDIT LOG QUERY ERROR]', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(
  userId: string,
  limit: number = 10
): Promise<AuditLogEntry[]> {
  const { logs } = await getAuditLogs({ userId, limit });
  return logs;
}

/**
 * Get security events (failures and warnings)
 */
export async function getSecurityEvents(
  organizationId: string,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        OR: [
          { status: 'FAILURE' },
          { status: 'WARNING' },
          { category: 'SECURITY' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log: AuditLogRecord) => ({
      id: log.id,
      action: log.action as AuditAction,
      category: log.category as AuditCategory,
      status: log.status as AuditStatus,
      userId: log.userId ?? undefined,
      userEmail: log.userEmail ?? undefined,
      organizationId: log.organizationId ?? undefined,
      targetType: log.targetType ?? undefined,
      targetId: log.targetId ?? undefined,
      description: log.description ?? undefined,
      metadata: log.metadata as Record<string, unknown> | undefined,
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      errorMessage: log.errorMessage ?? undefined,
      timestamp: log.createdAt,
    }));
  } catch (error) {
    console.error('[SECURITY EVENTS QUERY ERROR]', error);
    return [];
  }
}

/**
 * Delete old audit logs (data retention)
 */
export async function cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        // Keep security-related logs longer
        category: { not: 'SECURITY' },
      },
    });

    console.log(`[AUDIT LOG CLEANUP] Deleted ${result.count} old log entries`);
    return result.count;
  } catch (error) {
    console.error('[AUDIT LOG CLEANUP ERROR]', error);
    return 0;
  }
}

/**
 * Helper to get category from action
 */
export function getCategoryFromAction(action: AuditAction): AuditCategory {
  if (action.startsWith('user.login') || action.startsWith('user.logout') || action.startsWith('user.register') || action.startsWith('user.password')) {
    return 'AUTH';
  }
  if (action.startsWith('user.')) {
    return 'USER';
  }
  if (action.startsWith('org.')) {
    return 'ORGANIZATION';
  }
  if (action.startsWith('brand.')) {
    return 'BRAND';
  }
  if (action.startsWith('security.') || action.startsWith('api_key.') || action.startsWith('user.mfa') || action.startsWith('user.session')) {
    return 'SECURITY';
  }
  return 'SYSTEM';
}

// Helper to extract request info for audit logging
export function extractRequestInfo(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const headers = request.headers;

  // Get IP address (check various headers for proxy setups)
  const ipAddress =
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    undefined;

  const userAgent = headers.get('user-agent') || undefined;

  return { ipAddress, userAgent };
}
