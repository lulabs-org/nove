import {
  oAuthClientAdminControllerCreate,
  oAuthClientAdminControllerDisable,
  oAuthClientAdminControllerEnable,
  oAuthClientAdminControllerGetById,
  oAuthClientAdminControllerList,
  oAuthClientAdminControllerListDelegatableScopes,
  oAuthClientAdminControllerRotateSecret,
  oAuthClientAdminControllerUpdate,
} from '../../../../shared/lib/api/orval/business/admin-oauth-clients';
import type {
  CreateOAuthClientDto,
  OAuthClientAdminControllerListParams,
  UpdateOAuthClientDto,
} from '../../../../shared/lib/api/orval/business/schemas';

export const oauthClientApi = {
  list: (params: OAuthClientAdminControllerListParams) => oAuthClientAdminControllerList(params),
  create: (data: CreateOAuthClientDto) => oAuthClientAdminControllerCreate(data),
  detail: (id: string) => oAuthClientAdminControllerGetById(id),
  scopes: () => oAuthClientAdminControllerListDelegatableScopes(),
  update: (id: string, data: UpdateOAuthClientDto) => oAuthClientAdminControllerUpdate(id, data),
  disable: (id: string) => oAuthClientAdminControllerDisable(id),
  enable: (id: string) => oAuthClientAdminControllerEnable(id),
  rotateSecret: (id: string) => oAuthClientAdminControllerRotateSecret(id),
};
