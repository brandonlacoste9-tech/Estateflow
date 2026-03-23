import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || "a-very-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
    }
  }));

  // Facebook OAuth Routes
  app.get("/api/auth/facebook/url", (req, res) => {
    const redirectUri = `${process.env.APP_URL}/auth/facebook/callback`;
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: "ads_management,ads_read,public_profile",
      response_type: "code",
    });
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
    res.json({ url: authUrl });
  });

  app.get("/auth/facebook/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code missing");

    try {
      const redirectUri = `${process.env.APP_URL}/auth/facebook/callback`;
      const tokenResponse = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
        params: {
          client_id: process.env.FACEBOOK_CLIENT_ID,
          client_secret: process.env.FACEBOOK_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code,
        },
      });

      const { access_token } = tokenResponse.data;
      (req.session as any).facebookAccessToken = access_token;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Facebook OAuth error:", error.response?.data || error.message);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/facebook/status", (req, res) => {
    res.json({ connected: !!(req.session as any).facebookAccessToken });
  });

  // Facebook Ads API Routes
  app.post("/api/ads/launch", async (req, res) => {
    const accessToken = (req.session as any).facebookAccessToken;
    if (!accessToken) return res.status(401).json({ error: "Not connected to Facebook" });

    const { leadAddress, leadPhone } = req.body;
    const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;

    if (!adAccountId) return res.status(500).json({ error: "Ad Account ID not configured" });

    try {
      // 1. Create a Campaign (Simplified)
      const campaignResponse = await axios.post(`https://graph.facebook.com/v18.0/${adAccountId}/campaigns`, {
        name: `Lead Ad - ${leadAddress}`,
        objective: "OUTCOME_LEADS",
        status: "PAUSED", // Create as paused for safety
        special_ad_categories: ["HOUSING"], // Real estate ads require this
        access_token: accessToken,
      });

      const campaignId = campaignResponse.data.id;

      // In a real app, you'd create an ad set and ad creative here.
      // For this demo, we'll return the campaign ID as proof of concept.
      
      res.json({ 
        success: true, 
        campaignId,
        message: `Campaign created for ${leadAddress}. You can now finalize it in Facebook Ads Manager.`
      });
    } catch (error: any) {
      console.error("Facebook Ads API error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to launch ad" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
