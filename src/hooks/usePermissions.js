import { useAuthStore } from '../store/authStore';

export function usePermissions() {
  const permissions = useAuthStore(s => s.user?.permissions ?? []);

  function can(permission) {
    return permissions.includes(permission);
  }

  function canAny(...perms) {
    return perms.some(p => permissions.includes(p));
  }

  return { can, canAny };
}
