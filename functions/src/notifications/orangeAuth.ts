/**
 * Shared Orange OAuth token helper with fallback URLs.
 * Tries v1 first, then falls back to v3 if v1 fails.
 */

const OAUTH_URLS = [
  'https://api.orange.com/oauth/v1/token',
  'https://api.orange.com/oauth/v3/token',
];

export async function getOrangeToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  let lastError: Error | null = null;

  for (const url of OAUTH_URLS) {
    try {
      console.log(`[OrangeAuth] Trying OAuth URL: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[OrangeAuth] Failed on ${url} (${response.status}): ${text}`);
        lastError = new Error(`Orange OAuth failed (${response.status}): ${text}`);
        continue;
      }

      const data = await response.json() as { access_token?: string };
      if (!data.access_token) {
        lastError = new Error('OAuth response missing access_token');
        continue;
      }

      console.log(`[OrangeAuth] Token obtained via ${url}`);
      return data.access_token;
    } catch (err: any) {
      console.warn(`[OrangeAuth] Error on ${url}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Orange OAuth URLs failed');
}
