/**
 * POST /api/blessing/activity
 * Called when a community event fires (new post, reply, like).
 * Records activity into the current hour bucket for that wallet.
 * Body: { wallet, type: 'post' | 'reply' | 'like' }
 */

import { SCORE_CONFIG, cors } from './_config.js';
import { kvZincrby, kvExpire } from './_kv.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { return res.status(405).end(); }

  const { wallet, type } = req.body || {};
  if (!wallet || !type) return res.status(400).json({ error: 'wallet and type required' });

  const points = {
    post:  SCORE_CONFIG.social.post,
    reply: SCORE_CONFIG.social.reply,
    like:  SCORE_CONFIG.social.like,
  }[type];

  if (!points) return res.status(400).json({ error: 'invalid type' });

  const hourBucket = new Date().toISOString().slice(0, 13);
  const key        = `hourly:${hourBucket}`;

  await kvZincrby(key, points, wallet);
  await kvExpire(key, 48 * 60 * 60);

  return res.status(200).json({ ok: true });
}
