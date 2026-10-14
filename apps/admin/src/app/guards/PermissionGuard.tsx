import type { ReactNode } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';

interface PermissionGuardProps {
  permission?: string;
  children: ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { checkPermission } = useAuth();

  if (!permission) {
    return <>{children}</>;
  }

  const hasPermission = checkPermission(permission);

  if (!hasPermission) {
    return <div>无权限访问</div>;
  }

  return <>{children}</>;
}
