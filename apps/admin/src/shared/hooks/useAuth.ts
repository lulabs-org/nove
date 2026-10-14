import { useAuthStore } from '../../features/auth/model/authStore';

export function useAuth() {
  return useAuthStore();
}
