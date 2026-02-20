const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

exports.handler = async (event, context) => {
  try {
    const uniqueLink = await redis.spop("survey_links");

    if (!uniqueLink) {
      return {
        statusCode: 404,
        body: "<html><body><h3>Sorry! All survey links have been used.</h3></body></html>",
        headers: { "Content-Type": "text/html" }
      };
    }

    // This is the webpage the user will see
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; padding: 40px; background: #f4f7f6; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
        .link-box { background: #eee; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; font-family: monospace; border: 1px solid #ccc; }
        button { background: #0070f3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0051bb; }
        .message { color: #444; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Your Survey Link</h2>
        <p class="message">Here is your unique, anonymous survey link. Please copy and paste it into the address bar of your browser. You can save the link if you want to start the survey now and finish it later.</p>
        
        <div class="link-box" id="linkText">${uniqueLink}</div>
        
        <button onclick="copyLink()">Copy Link</button>

        <script>
          function copyLink() {
            const text = document.getElementById('linkText').innerText;
            navigator.clipboard.writeText(text).then(() => {
              alert('Link copied to clipboard!');
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
