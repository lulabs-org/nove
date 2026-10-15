import { mutator } from '../../../shared/lib/api/mutator';

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

export function getOAuthAuthorizationRequest(
  requestId: string
): Promise<OAuthAuthorizationRequest> {
  return mutator<OAuthAuthorizationRequest>({
    url: `/api/oauth/authorization-requests/${encodeURIComponent(requestId)}`,
    method: 'GET',
  });
}

export function approveOAuthAuthorizationRequest(
  requestId: string,
  scopes: string[],
  organizationId: string
): Promise<OAuthDecisionResponse> {
  return mutator<OAuthDecisionResponse>({
    url: `/api/oauth/authorization-requests/${encodeURIComponent(requestId)}/approve`,
    method: 'POST',
    data: { scopes, organization_id: organizationId },
  });
}

export function denyOAuthAuthorizationRequest(requestId: string): Promise<OAuthDecisionResponse> {
  return mutator<OAuthDecisionResponse>({
    url: `/api/oauth/authorization-requests/${encodeURIComponent(requestId)}/deny`,
    method: 'POST',
  });
}
