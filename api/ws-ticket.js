/**
 * GET /api/ws-ticket
 * Returns a short-lived WebSocket ticket from the CC API.
 * Called by the OBS overlay before opening the real-time connection.
 * Uses getWsTicketServer (server-side, no user auth needed).
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store'); // tickets are single-use

  if (req.method !== 'GET') { res.status(405).end(); return; }

  const tokenAddress = process.env.PADRE_TOKEN_ADDRESS;
  const apiKey       = process.env.CC_API_KEY;

  if (!tokenAddress || !apiKey) {
    return res.status(200).json({ ticket: null, reason: 'Token not launched yet' });
  }

  try {
    const { configureApi, api } = await import('@coin-communities/sdk/node');

    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: { 'x-api-key': apiKey },
    });

    const result = await api.getWsTicketServer({ path: { token_address: tokenAddress } });
    const ticket = result?.data?.ticket || result?.ticket || result?.token;

    return res.status(200).json({ ticket, tokenAddress });
  } catch (e) {
    console.error('[ws-ticket]', e);
    return res.status(500).json({ error: 'Failed to get WS ticket' });
  }
}
