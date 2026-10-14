import { http } from '../../../shared/lib/api/http';

export interface OAuthPermission {
  code: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface OAuthAuthorizationRequest {
  requestId: string;
  client: {
    clientId: string;
    name: string;
    description: string | null;
    logoUri: string | null;
  };
  permissions: OAuthPermission[];
  organizations: Array<{ id: string; name: string; code: string }>;
  expiresAt: string;
}

interface OAuthDecisionResponse {
  redirect_uri: string;
}

export async function getOAuthAuthorizationRequest(requestId: string) {
  const response = await http.get<OAuthAuthorizationRequest>(
    `/api/oauth/authorization-requests/${encodeURIComponent(requestId)}`
  );
  return response.data;
}

export async function approveOAuthAuthorizationRequest(
  requestId: string,
  scopes: string[],
  organizationId: string
) {
  const response = await http.post<OAuthDecisionResponse>(
    `/api/oauth/authorization-requests/${encodeURIComponent(requestId)}/approve`,
    { scopes, organization_id: organizationId }
  );
  return response.data;
}

export async function denyOAuthAuthorizationRequest(requestId: string) {
  const response = await http.post<OAuthDecisionResponse>(
    `/api/oauth/authorization-requests/${encodeURIComponent(requestId)}/deny`
  );
  return response.data;
}
