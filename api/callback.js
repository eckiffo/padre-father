/**
 * GET /api/callback?challengeCode=...
 * Catches the CC Twitter OAuth redirect and displays the challengeCode.
 * Copy the code shown and paste into get-tokens.mjs
 */

export default function handler(req, res) {
  const code = req.query?.challengeCode || req.query?.code || '';

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <title>$PADRE Auth</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; color: #fff; font-family: 'Courier New', monospace;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; padding: 24px; }
    .card { background: #111; border: 1px solid #222; border-radius: 8px;
            padding: 40px; max-width: 600px; width: 100%; text-align: center; }
    h1 { font-size: 24px; color: #00E676; margin-bottom: 8px; }
    p  { color: #888; font-size: 14px; margin-bottom: 24px; }
    .code-box { background: #0a0a0a; border: 1px solid #333; border-radius: 6px;
                padding: 20px; font-size: 13px; color: #00E676; word-break: break-all;
                text-align: left; margin-bottom: 20px; cursor: pointer; }
    .copy-btn { background: #00E676; color: #000; border: none; border-radius: 6px;
                padding: 12px 32px; font-size: 14px; font-weight: 700;
                cursor: pointer; letter-spacing: 0.05em; }
    .copy-btn:hover { background: #39FF14; }
    .copied { color: #00E676; font-size: 13px; margin-top: 12px; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✝ Auth Complete</h1>
    <p>Copy this code and paste it into the terminal running get-tokens.mjs</p>
    <div class="code-box" id="code">${code || '— no code received —'}</div>
    <button class="copy-btn" onclick="copyCode()">Copy Code</button>
    <div class="copied" id="copied">✅ Copied to clipboard</div>
  </div>
  <script>
    function copyCode() {
      navigator.clipboard.writeText(${JSON.stringify(code)}).then(() => {
        document.getElementById('copied').style.display = 'block';
        setTimeout(() => document.getElementById('copied').style.display = 'none', 2000);
      });
    }
  </script>
</body>
</html>`);
}
