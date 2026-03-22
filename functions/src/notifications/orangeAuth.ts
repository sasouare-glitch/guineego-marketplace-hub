/**
 * Shared Orange OAuth token helper.
 * Orange SMS Guinea Conakry 2.0 uses OAuth v3.
 */

const ORANGE_OAUTH_URL = 'https://api.orange.com/oauth/v3/token';

type OrangeTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export async function getOrangeToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  console.log(`[OrangeAuth] Requesting OAuth token from ${ORANGE_OAUTH_URL}`);

  const response = await fetch(ORANGE_OAUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  const rawBody = await response.text();
  let data: OrangeTokenResponse = {};

  try {
    data = rawBody ? JSON.parse(rawBody) as OrangeTokenResponse : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const errorMessage = data.error_description || rawBody || 'Unknown Orange OAuth error';
    throw new Error(`Orange OAuth failed (${response.status}): ${errorMessage}`);
  }

  if (!data.access_token) {
    throw new Error('Orange OAuth response missing access_token');
  }

  console.log('[OrangeAuth] Token obtained successfully');
  return data.access_token;
}
