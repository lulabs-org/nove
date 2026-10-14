import { PersonAvatar } from '../components/PersonAvatar';
import type { AdminUser } from './types';

export function UserAvatar({ user }: { user: AdminUser }) {
  return (
    <PersonAvatar
      size={36}
      seed={user.id}
      src={user.avatar ?? user.profile?.avatar}
      name={
        user.displayName ??
        user.fullName ??
        user.profile?.displayName ??
        user.profile?.fullName ??
        user.username ??
        user.email
      }
    />
  );
}
