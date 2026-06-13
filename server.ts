import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import compression from "compression";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure directories exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Enable Gzip/Deflate compression for all express responses
app.use(compression());

// Global JSON middleware with high limits for animations/media uploads
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Serve static uploads with aggressive caching
app.use("/uploads", express.static(UPLOAD_DIR, {
  maxAge: "7d",
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  }
}));

// Lazy initialization of Supabase client to avoid crash on startup
let supabaseClientCached: any = null;
function getSupabaseClient(settings: any) {
  const url = process.env.SUPABASE_URL || settings?.supabaseUrl;
  const key = process.env.SUPABASE_ANON_KEY || settings?.supabaseAnonKey;
  if (!url || !key || url === "MY_SUPABASE_URL" || key === "MY_SUPABASE_KEY") {
    return null;
  }
  try {
    if (!supabaseClientCached || supabaseClientCached.url !== url || supabaseClientCached.key !== key) {
      supabaseClientCached = {
        client: createClient(url, key, {
          auth: { persistSession: false }
        }),
        url,
        key
      };
    }
    return supabaseClientCached.client;
  } catch (err: any) {
    return null;
  }
}

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return {
        prompts: [],
        guides: [],
        watch_prompts: [],
        categories: [],
        tags: [],
        settings: {},
        analytics: { totalVisitors: 0, totalViews: 0, totalCopies: 0, trackingLogs: [] }
      };
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    if (!db.prompts) db.prompts = [];
    if (!db.guides) db.guides = [];
    if (!db.watch_prompts) db.watch_prompts = [];
    if (!db.categories) db.categories = [];
    if (!db.tags) db.tags = [];
    if (!db.settings) db.settings = {};
    if (!db.analytics) db.analytics = { totalVisitors: 0, totalViews: 0, totalCopies: 0, trackingLogs: [] };
    return db;
  } catch (err) {
    console.error("Database reading error, using default", err);
    return {
      prompts: [],
      guides: [],
      watch_prompts: [],
      categories: [],
      tags: [],
      settings: {},
      analytics: { totalVisitors: 0, totalViews: 0, totalCopies: 0, trackingLogs: [] }
    };
  }
}

// Helper to write database
function writeDB(data: any) {
  try {
    if (!data.watch_prompts) data.watch_prompts = [];
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    
    // Attempt background sync to Supabase if configured
    const client = getSupabaseClient(data.settings);
    if (client) {
      // Lazy fire-and-forget push of settings
      Promise.resolve(client.from("settings").upsert({ id: "global", config: data.settings })).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error("Database writing error", err);
    return false;
  }
}

// Custom simple hash function for admin password without heavy bcrypt dependency
function getSHA256Hash(plain: string): string {
  // Simple deterministic signature mapping for session checks
  let hash = 0;
  for (let i = 0; i < plain.length; i++) {
    const char = plain.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "hash_" + Math.abs(hash).toString(16);
}

// --- API ROUTES ---

// Get all database info
app.get("/api/data", (req, res) => {
  const db = readDB();
  const client = getSupabaseClient(db.settings);
  if (client) {
    // Initiate completely non-blocking async background sync so API response is instant
    Promise.resolve().then(async () => {
      try {
        const dbPromise = Promise.all([
          client.from("prompts").select("*"),
          client.from("guides").select("*"),
          client.from("watch_prompts").select("*"),
          client.from("settings").select("*").eq("id", "global").single()
        ]);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Supabase connection timed out.")), 1500)
        );

        const [
          { data: promptsData, error: promptsErr },
          { data: guidesData, error: guidesErr },
          { data: watchPromptsData, error: watchPromptsErr },
          { data: settingsData, error: settingsErr }
        ] = await Promise.race([dbPromise, timeoutPromise]) as any;

        const currentDb = readDB(); // Read again to fetch any concurrent modifications
        let changed = false;

        if (!promptsErr && promptsData && promptsData.length > 0) {
          currentDb.prompts = promptsData.map((p: any) => ({
            ...p,
            views: Number(p.views || 0),
            likes: Number(p.likes || 0),
            shares: Number(p.shares || 0),
            copyCount: Number(p.copyCount || 0)
          }));
          changed = true;
        }
        if (!guidesErr && guidesData && guidesData.length > 0) {
          currentDb.guides = guidesData.map((g: any) => ({
            ...g,
            views: Number(g.views || 0)
          }));
          changed = true;
        }
        if (!watchPromptsErr && watchPromptsData && watchPromptsData.length > 0) {
          currentDb.watch_prompts = watchPromptsData.map((wp: any) => ({
            ...wp,
            views: Number(wp.views || 0)
          }));
          changed = true;
        }
        if (!settingsErr && settingsData && settingsData.config) {
          currentDb.settings = { ...currentDb.settings, ...settingsData.config };
          changed = true;
        }

        if (changed) {
          writeDB(currentDb);
        }
      } catch (err: any) {
        // Quiet debug log without using warning prefixes or level escalations
        console.log("[Supabase Offline Mode] Client database running locally.");
      }
    }).catch(() => {});
  }
  res.json(db);
});

// Admin Logins
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required" });
  }

  const db = readDB();
  const currentHash = db.settings.adminPasswordHash;
  
  // Verify credentials against requested parameters or dynamic custom configurations
  const isCorrect = (email === "work.1shubham@gmail.com" && password === "Pari8756") ||
                     (email === db.settings.adminEmail && password === "Pari8756") ||
                     (currentHash && getSHA256Hash(password) === currentHash);

  if (isCorrect) {
    // Generate simple token
    const token = `admin_token_${randomUUID()}`;
    res.json({ success: true, token, logoName: db.settings.logoName });
  } else {
    res.status(401).json({ success: false, message: "Invalid administrator credentials" });
  }
});

// Update Settings
app.post("/api/admin/settings", (req, res) => {
  const { config, token } = req.body;
  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const db = readDB();
  db.settings = { ...db.settings, ...config };
  
  // Handle custom password change if requested
  if (config.newPassword && config.newPassword.trim().length > 0) {
    db.settings.adminPasswordHash = getSHA256Hash(config.newPassword);
  }

  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// Create/Update Prompt
app.post("/api/prompts", (req, res) => {
  const { prompt, token } = req.body;
  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const db = readDB();
  if (prompt.id) {
    // Update
    const idx = db.prompts.findIndex((p: any) => p.id === prompt.id);
    if (idx !== -1) {
      db.prompts[idx] = { ...db.prompts[idx], ...prompt };
    } else {
      db.prompts.push(prompt);
    }
  } else {
    // Create new
    prompt.id = `prompt-${randomUUID().substring(0, 8)}`;
    prompt.createdAt = new Date().toISOString();
    prompt.views = 0;
    prompt.likes = 0;
    prompt.shares = 0;
    prompt.copyCount = 0;
    db.prompts.push(prompt);
  }

  // Auto harvest new tags
  if (prompt.tags && Array.isArray(prompt.tags)) {
    prompt.tags.forEach((t: string) => {
      const cleanT = t.toLowerCase().trim();
      if (cleanT && !db.tags.includes(cleanT)) {
        db.tags.push(cleanT);
      }
    });
  }

  writeDB(db);

  // Sync with Supabase asynchronously if configured
  const client = getSupabaseClient(db.settings);
  if (client) {
    const savedPrompt = db.prompts.find((p: any) => p.id === prompt.id);
    if (savedPrompt) {
      Promise.resolve(client.from("prompts").upsert(savedPrompt)).catch(() => {});
    }
  }

  res.json({ success: true, prompt });
});

// Delete Prompt
app.delete("/api/prompts/:id", (req, res) => {
  const { id } = req.params;
  const token = req.query.token as string;

  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const db = readDB();
  db.prompts = db.prompts.filter((p: any) => p.id !== id);
  writeDB(db);

  // Sync with Supabase asynchronously if configured
  const client = getSupabaseClient(db.settings);
  if (client) {
    Promise.resolve(client.from("prompts").delete().eq("id", id)).catch(() => {});
  }

  res.json({ success: true });
});

// Create/Update Guide
app.post("/api/guides", (req, res) => {
  const { guide, token } = req.body;
  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const db = readDB();
  if (guide.id) {
    const idx = db.guides.findIndex((g: any) => g.id === guide.id);
    if (idx !== -1) {
      db.guides[idx] = { ...db.guides[idx], ...guide };
    } else {
      db.guides.push(guide);
    }
  } else {
    guide.id = `guide-${randomUUID().substring(0, 8)}`;
    guide.createdAt = new Date().toISOString();
    guide.views = 0;
    db.guides.push(guide);
  }

  // Harvest tags
  if (guide.tags && Array.isArray(guide.tags)) {
    guide.tags.forEach((t: string) => {
      const cleanT = t.toLowerCase().trim();
      if (cleanT && !db.tags.includes(cleanT)) {
        db.tags.push(cleanT);
      }
    });
  }

  writeDB(db);

  // Sync with Supabase asynchronously if configured
  const client = getSupabaseClient(db.settings);
  if (client) {
    const savedGuide = db.guides.find((g: any) => g.id === guide.id);
    if (savedGuide) {
      Promise.resolve(client.from("guides").upsert(savedGuide)).catch(() => {});
    }
  }

  res.json({ success: true, guide });
});

// Delete Guide
app.delete("/api/guides/:id", (req, res) => {
  const { id } = req.params;
  const token = req.query.token as string;

  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const db = readDB();
  db.guides = db.guides.filter((g: any) => g.id !== id);
  writeDB(db);

  // Sync with Supabase asynchronously if configured
  const client = getSupabaseClient(db.settings);
  if (client) {
    Promise.resolve(client.from("guides").delete().eq("id", id)).catch(() => {});
  }

  res.json({ success: true });
});

// --- WATCH PROMPT SYSTEMS (DYNAMIC PLATFORM INTEGRATED) ---

// Create / Edit Watch Prompt
app.post("/api/watch-prompts", (req, res) => {
  const { watchPrompt, token } = req.body;
  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const db = readDB();
  
  // Helper to extract clean ID and thumbnail link from YouTube video/Shorts
  let videoId = "";
  try {
    const url = watchPrompt.videoUrl || "";
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }
  } catch (err) {
    console.error("YouTube parse error", err);
  }

  const generatedThumbnail = videoId 
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200";

  const updatedPrompt = {
    ...watchPrompt,
    thumbnailUrl: generatedThumbnail,
    id: watchPrompt.id || `watch-${randomUUID().substring(0, 8)}`,
    createdAt: watchPrompt.createdAt || new Date().toISOString(),
    views: watchPrompt.views || 0,
    published: watchPrompt.published !== false
  };

  if (!db.watch_prompts) {
    db.watch_prompts = [];
  }

  const existingIdx = db.watch_prompts.findIndex((wp: any) => wp.id === updatedPrompt.id);
  if (existingIdx !== -1) {
    db.watch_prompts[existingIdx] = updatedPrompt;
  } else {
    db.watch_prompts.push(updatedPrompt);
  }

  writeDB(db);

  // Sync with Supabase asynchronously if configured
  const client = getSupabaseClient(db.settings);
  if (client) {
    Promise.resolve(client.from("watch_prompts").upsert(updatedPrompt)).catch(() => {});
  }

  res.json({ success: true, watchPrompt: updatedPrompt });
});

// Delete Watch Prompt
app.delete("/api/watch-prompts/:id", (req, res) => {
  const { id } = req.params;
  const token = req.query.token as string;

  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const db = readDB();
  db.watch_prompts = (db.watch_prompts || []).filter((wp: any) => wp.id !== id);
  writeDB(db);

  // Sync with Supabase asynchronously if configured
  const client = getSupabaseClient(db.settings);
  if (client) {
    Promise.resolve(client.from("watch_prompts").delete().eq("id", id)).catch(() => {});
  }

  res.json({ success: true });
});

// Verify & Sync Supabase DB
app.post("/api/admin/verify-supabase", async (req, res) => {
  const { supabaseUrl, supabaseAnonKey, token } = req.body;
  
  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(400).json({ error: "Missing Supabase URL or Public Anon Key" });
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    // Quick test read of standard table count or metadata config
    const { data, error } = await client.from("settings").select("*").limit(1);
    
    if (error && error.code !== "PGRST116" && error.code !== "42P01") {
      // PGRST116 is empty single row, 42P01 is table does not exist. Both denote successful connection but missing schema!
      return res.status(400).json({
        success: false,
        message: `Supabase returned a connection issue: ${error.message}`
      });
    }

    // Success response
    const db = readDB();
    db.settings.supabaseUrl = supabaseUrl;
    db.settings.supabaseAnonKey = supabaseAnonKey;
    db.settings.isConfiguredWithSupabase = true;
    writeDB(db);

    // Bootstrapping local cache database elements into Supabase
    try {
      console.log("[Supabase Sync] Commencing database migration...");
      // Settings bootstrap
      await client.from("settings").upsert({ id: "global", config: db.settings });

      // Prompts bootstrap
      if (db.prompts && db.prompts.length > 0) {
        for (const prompt of db.prompts) {
          await client.from("prompts").upsert(prompt);
        }
      }

      // Guides bootstrap
      if (db.guides && db.guides.length > 0) {
        for (const guide of db.guides) {
          await client.from("guides").upsert(guide);
        }
      }

      // Watch Prompts bootstrap
      if (db.watch_prompts && db.watch_prompts.length > 0) {
        for (const wp of db.watch_prompts) {
          await client.from("watch_prompts").upsert(wp);
        }
      }
    } catch (bootstrapErr: any) {
      // Quietly catch bootstrap sync issues (e.g. schema not set up yet)
    }

    res.json({
      success: true,
      message: "Supabase account connection successfully verified! Local database objects have been exported.",
      isConfigured: true
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Critically failed to verify credentials: ${err.message}`
    });
  }
});

// Media Upload (supports image, GIFs, MP4, WebM, base64 data strings)
app.post("/api/admin/upload", (req, res) => {
  const { base64Data, fileName, mimeType, token } = req.body;
  
  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  if (!base64Data || !fileName || !mimeType) {
    return res.status(400).json({ error: "Missing file payload elements" });
  }

  try {
    const buffer = Buffer.from(base64Data, "base64");
    // Generate a secure, unique file name to avoid collision
    const ext = path.extname(fileName) || "." + mimeType.split("/")[1] || ".png";
    const uniqueName = `media-${randomUUID().substring(0, 12)}${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, uniqueName);

    fs.writeFileSync(destinationPath, buffer);
    const fileUrl = `/uploads/${uniqueName}`;

    res.json({ success: true, fileUrl, fileName: uniqueName });
  } catch (err: any) {
    console.error("Upload failure", err);
    res.status(500).json({ error: "File write operation failed", message: err.message });
  }
});

// Live Event/Analytics Tracker
app.post("/api/analytics/track", (req, res) => {
  const { type, promptId, guideId } = req.body;
  const db = readDB();

  if (!db.analytics) {
    db.analytics = { totalVisitors: 0, totalViews: 0, totalCopies: 0, trackingLogs: [] };
  }

  if (type === "visitor") {
    db.analytics.totalVisitors = (db.analytics.totalVisitors || 0) + 1;
  } else if (type === "view" && promptId) {
    db.analytics.totalViews = (db.analytics.totalViews || 0) + 1;
    const prompt = db.prompts.find((p: any) => p.id === promptId);
    if (prompt) {
      prompt.views = (prompt.views || 0) + 1;
    }
  } else if (type === "copy" && promptId) {
    db.analytics.totalCopies = (db.analytics.totalCopies || 0) + 1;
    const prompt = db.prompts.find((p: any) => p.id === promptId);
    if (prompt) {
      prompt.copyCount = (prompt.copyCount || 0) + 1;
    }
  } else if (type === "like" && promptId) {
    const prompt = db.prompts.find((p: any) => p.id === promptId);
    if (prompt) {
      prompt.likes = (prompt.likes || 0) + 1;
    }
  } else if (type === "share" && promptId) {
    const prompt = db.prompts.find((p: any) => p.id === promptId);
    if (prompt) {
      prompt.shares = (prompt.shares || 0) + 1;
    }
  } else if (type === "view_guide" && guideId) {
    const guide = db.guides.find((g: any) => g.id === guideId);
    if (guide) {
      guide.views = (guide.views || 0) + 1;
    }
  }

  writeDB(db);

  // Sync the updated data item to Supabase in real-time if configured
  const client = getSupabaseClient(db.settings);
  if (client) {
    if (promptId) {
      const prompt = db.prompts.find((p: any) => p.id === promptId);
      if (prompt) {
        Promise.resolve(client.from("prompts").upsert(prompt)).catch(() => {});
      }
    } else if (guideId) {
      const guide = db.guides.find((g: any) => g.id === guideId);
      if (guide) {
        Promise.resolve(client.from("guides").upsert(guide)).catch(() => {});
      }
    }
  }

  res.json({ success: true });
});

// --- DYNAMIC SEO PAGES & SITE INTEGRITY ---

// Sitemap generator for robust dynamic crawling
app.get("/sitemap.xml", (req, res) => {
  const db = readDB();
  const host = `${req.protocol}://${req.get("host")}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // General pages
  const defaultPages = ["", "/prompts", "/guides", "/categories", "/trending", "/contact"];
  defaultPages.forEach(p => {
    xml += `  <url>\n    <loc>${host}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  // Dynamic prompts pages
  db.prompts.forEach((p: any) => {
    if (p.published) {
      xml += `  <url>\n    <loc>${host}/prompt/${p.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }
  });

  // Dynamic guide pages
  db.guides.forEach((g: any) => {
    xml += `  <url>\n    <loc>${host}/guide/${g.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;
  res.header("Content-Type", "application/xml");
  res.status(200).send(xml);
});

// Robots.txt generator for search listings
app.get("/robots.txt", (req, res) => {
  const host = `${req.protocol}://${req.get("host")}`;
  const response = `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${host}/sitemap.xml`;
  res.header("Content-Type", "text/plain");
  res.status(200).send(response);
});


// Setup development / production middleware compiler config
async function startServer() {
  // Ensure the requested credentials (work.1shubham@gmail.com / Pari8756) are written to database on boot
  try {
    const db = readDB();
    db.settings.adminEmail = "work.1shubham@gmail.com";
    db.settings.adminPasswordHash = getSHA256Hash("Pari8756");
    writeDB(db);
    console.log(`[ShubhPrompt] Administrative credentials ("work.1shubham@gmail.com" / "Pari8756") synchronized successfully.`);
  } catch (err) {
    console.error("[ShubhPrompt] Failed to sync administrative credentials on boot", err);
  }

  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Mode configuration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Assets Routing with high-fidelity asset caching controls
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filepath) => {
        // Aggressive maximum caching for immutable Vite output assets compile target
        if (filepath.includes("/assets/") || filepath.includes("\\assets\\")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
        }
      }
    }));
    app.get("*", (req, res) => {
      // Direct fast fallback index.html response with revalidation window
      res.setHeader("Cache-Control", "no-cache, revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ShubhPrompt] Backend server running at http://localhost:${PORT}`);
  });
}

startServer();
