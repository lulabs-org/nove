import type { ReactNode } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';

interface PermProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Perm({ permission, children, fallback = null }: PermProps) {
  const { checkPermission } = useAuth();

  const hasPermission = checkPermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
