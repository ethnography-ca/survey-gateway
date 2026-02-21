const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

exports.handler = async (event, context) => {
  try {
    // 1. Atomically "pop" the link (removes it from available set)
    const uniqueLink = await redis.spop("survey_links");

    // 2. If no links are left, show the "All used" message
    if (!uniqueLink) {
      return {
        statusCode: 404,
        body: "<html><body style='font-family:sans-serif; text-align:center; padding-top:50px;'><h3>Sorry! All survey links have been used.</h3></body></html>",
        headers: { "Content-Type": "text/html" }
      };
    }

    // 3. LOGGING: Add the link to the "used_links" set for your records
    // This happens before the user even sees the page.
    await redis.sadd("used_links", uniqueLink);

    // 4. Return the HTML page with the link
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; padding: 40px; background: #f4f7f6; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
        .link-box { background: #eee; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; font-family: monospace; border: 1px solid #ccc; font-size: 14px; }
        button { background: #0070f3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; }
        button:hover { background: #0051bb; }
        .message { color: #444; line-height: 1.5; font-size: 15px; }
        .success-msg { color: #28a745; font-size: 13px; margin-top: 10px; display: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Your Survey Link</h2>
        <p class="message">Here is your unique, anonymous survey link. Please copy and paste it into the address bar of your browser. You can save the link if you want to start the survey now and finish it later.</p>
        
        <div class="link-box" id="linkText">${uniqueLink}</div>
        
        <button id="copyBtn" onclick="copyLink()">Copy Link</button>
        <p id="success" class="success-msg">✔ Link copied to clipboard!</p>

        <script>
          function copyLink() {
            const text = document.getElementById('linkText').innerText;
            navigator.clipboard.writeText(text).then(() => {
              const btn = document.getElementById('copyBtn');
              const msg = document.getElementById('success');
              msg.style.display = 'block';
              btn.innerText = 'Copied!';
              setTimeout(() => {
                btn.innerText = 'Copy Link';
                msg.style.display = 'none';
              }, 3000);
            });
          }
        </script>
      </div>
    </body>
    </html>
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
