import { profileRoutes } from './profile';
import { securityRoutes } from './security';

export const accountRoutes = [...profileRoutes, ...securityRoutes];
