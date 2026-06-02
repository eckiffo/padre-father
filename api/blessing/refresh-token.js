/**
 * GET /api/blessing/refresh-token
 * Refreshes the CC access token and stores it in KV.
 * Called by Vercel cron every 12h — token expires every ~24h.
 * Other endpoints read CC_ACCESS_TOKEN from env, but this stores
 * the refreshed token in KV so sync.js can pick it up.
 */

import { cors } from './_config.js';
import { kvGet, kvSet } from './_kv.js';

const CC_API_KEY      = process.env.CC_API_KEY      || null;
const CC_REFRESH_TOKEN = process.env.CC_REFRESH_TOKEN || null;
const CRON_SECRET     = process.env.CRON_SECRET     || null;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Auth — allow Vercel cron or manual with secret
  const cronHeader  = req.headers['authorization'] || '';
  const secretParam = req.query?.secret;
  const isCron      = cronHeader === `Bearer ${CRON_SECRET || ''}`;
  const isManual    = CRON_SECRET && secretParam === CRON_SECRET;
  const isOpen      = !CRON_SECRET;

  if (!isCron && !isManual && !isOpen) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!CC_API_KEY || !CC_REFRESH_TOKEN) {
    return res.status(200).json({ ok: false, reason: 'CC_API_KEY or CC_REFRESH_TOKEN not set' });
  }

  try {
    const { configureApi, api } = await import('@coin-communities/sdk/node');
    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: { 'x-api-key': CC_API_KEY },
    });

    const result = await api.refreshToken({ body: { refreshToken: CC_REFRESH_TOKEN } });
    const newAccessToken = result?.data?.accessToken;
    const newRefreshToken = result?.data?.refreshToken;

    if (!newAccessToken) {
      return res.status(200).json({ ok: false, reason: 'No access token returned', result });
    }

    // Store in KV so sync.js reads fresh token
    await kvSet('cc:access_token', newAccessToken, { ex: 23 * 60 * 60 }); // 23h TTL
    if (newRefreshToken) {
      await kvSet('cc:refresh_token', newRefreshToken, { ex: 30 * 24 * 60 * 60 }); // 30d
    }

    console.log('[refresh-token] CC access token refreshed successfully');
    return res.status(200).json({
      ok: true,
      refreshedAt: new Date().toISOString(),
      expiresIn: '23h',
    });

  } catch (e) {
    console.error('[refresh-token]', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
