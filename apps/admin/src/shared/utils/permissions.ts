export const PERMISSIONS = {
  USER: {
    READ: 'user:read',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    RESET_PASSWORD: 'user:reset-password',
  },
  IDENTITY_DOCUMENT: {
    READ: 'identity-document:read',
    WRITE: 'identity-document:write',
    REVIEW: 'identity-document:review',
  },
  ROLE: {
    READ: 'role:read',
    CREATE: 'role:create',
    UPDATE: 'role:update',
    DELETE: 'role:delete',
    ASSIGN_PERMISSION: 'role:assign-permission',
  },
  PERMISSION: {
    READ: 'permission:read',
    CREATE: 'permission:create',
    UPDATE: 'permission:update',
    DELETE: 'permission:delete',
  },
  ORGANIZATION: {
    READ: 'org:read',
    CREATE: 'org:create',
    UPDATE: 'org:update',
    DELETE: 'org:delete',
  },
  ORG_MEMBER: {
    READ: 'org-member:read',
    CREATE: 'org-member:create',
    UPDATE: 'org-member:update',
    DELETE: 'org-member:delete',
  },
  DEPARTMENT: {
    READ: 'dept:read',
    CREATE: 'dept:create',
    UPDATE: 'dept:update',
    DELETE: 'dept:delete',
  },
  PLATFORM_USER: {
    READ: 'platform-user:read',
    CREATE: 'platform-user:create',
    UPDATE: 'platform-user:update',
    DELETE: 'platform-user:delete',
  },
  API_KEY: {
    READ: 'api-key:read',
    CREATE: 'api-key:create',
    UPDATE: 'api-key:update',
    DELETE: 'api-key:delete',
    REVOKE: 'api-key:revoke',
    ROTATE: 'api-key:rotate',
  },
  OAUTH_CLIENT: {
    READ: 'oauth-client:read',
    CREATE: 'oauth-client:create',
    UPDATE: 'oauth-client:update',
    DISABLE: 'oauth-client:disable',
    ROTATE_SECRET: 'oauth-client:rotate-secret',
  },
  PRODUCT: {
    READ: 'product:read',
    CREATE: 'product:create',
    UPDATE: 'product:update',
    DELETE: 'product:delete',
    TOGGLE_STATUS: 'product:toggle-status',
  },
  PROJECT: {
    READ: 'project:read',
    CREATE: 'project:create',
    UPDATE: 'project:update',
    DELETE: 'project:delete',
    TOGGLE_STATUS: 'project:toggle-status',
  },
  CHANNEL: {
    READ: 'channel:read',
    CREATE: 'channel:create',
    UPDATE: 'channel:update',
    DELETE: 'channel:delete',
  },
  ORDER: {
    READ: 'order:read',
    CREATE: 'order:create',
    UPDATE: 'order:update',
    DELETE: 'order:delete',
    STATUS: 'order:status',
  },
  ORDER_REFUND: {
    READ: 'order-refund:read',
    CREATE: 'order-refund:create',
    UPDATE: 'order-refund:update',
    DELETE: 'order-refund:delete',
    SETTLE: 'order-refund:settle',
  },
  FINANCE: {
    READ: 'finance:read',
    EXPORT: 'finance:export',
    AUDIT: 'finance:audit',
  },
  SYSTEM: {
    MONITOR: 'system:monitor',
    LOG: 'system:log',
    CONFIG_READ: 'system:config:read',
    CONFIG_WRITE: 'system:config:write',
  },
  DASHBOARD: {
    READ: 'dashboard:read',
    MANAGE: 'dashboard:manage',
  },
  PROFIT_SHARING: {
    READ: 'profit-sharing:read',
    CREATE: 'profit-sharing:create',
    UPDATE: 'profit-sharing:update',
    DELETE: 'profit-sharing:delete',
  },
  MEETING: {
    READ: 'meeting:read',
    CREATE: 'meeting:create',
    UPDATE: 'meeting:update',
    DELETE: 'meeting:delete',
    REPROCESS: 'meeting:reprocess',
  },
  MINUTE: {
    READ: 'minute:read',
    CREATE: 'minute:create',
    UPDATE: 'minute:update',
    DELETE: 'minute:delete',
  },
  MINUTE_SUMMARY: {
    READ: 'minute-summary:read',
    CREATE: 'minute-summary:create',
    UPDATE: 'minute-summary:update',
    DELETE: 'minute-summary:delete',
  },
  SPEAKER_SUMMARY: {
    READ: 'speaker-summary:read',
    CREATE: 'speaker-summary:create',
    UPDATE: 'speaker-summary:update',
    DELETE: 'speaker-summary:delete',
  },
  TASK: {
    READ: 'task:read',
    CREATE: 'task:create',
    UPDATE: 'task:update',
    DELETE: 'task:delete',
    RUN: 'task:run',
    PAUSE: 'task:pause',
    RESUME: 'task:resume',
  },
  TRACKING_REPORT: {
    READ: 'tracking-report:read',
    CREATE: 'tracking-report:create',
    UPDATE: 'tracking-report:update',
    DELETE: 'tracking-report:delete',
  },
  DRIVE: {
    READ: 'drive:read',
    UPLOAD: 'drive:upload',
    UPDATE: 'drive:update',
    DELETE: 'drive:delete',
    MANAGE_ACL: 'drive:manage-acl',
    ADMIN: 'drive:admin',
  },
  SKILL: {
    READ: 'skill:read',
    CREATE: 'skill:create',
    UPDATE: 'skill:update',
    DELETE: 'skill:delete',
  },
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];

export function hasAnyPermission(
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean {
  if (!userPermissions) return false;
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

export function hasAllPermissions(
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean {
  if (!userPermissions) return false;
  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

export function hasWildcardPermission(
  userPermissions: string[] | undefined,
  permission: string
): boolean {
  if (!userPermissions) return false;

  const hasExactPermission = userPermissions.includes(permission);
  if (hasExactPermission) return true;

  const parts = permission.split(':');
  if (parts.length === 2) {
    const wildcardPermission = `${parts[0]}:*`;
    return userPermissions.includes(wildcardPermission);
  }

  return false;
}
