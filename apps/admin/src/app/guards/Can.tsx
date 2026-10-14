import type { ReactNode } from 'react';
import { subject as caslSubject, type AnyAbility } from '@casl/ability';

export interface CanProps {
  I: string;
  a?: string;
  this?: Record<string, unknown>;
  ability: AnyAbility;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ I, a, this: thisSubject, ability, children, fallback = null }: CanProps) {
  const target = a && thisSubject ? caslSubject(a, thisSubject) : thisSubject || a;
  const isAllowed = target ? ability.can(I, target) : false;

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
