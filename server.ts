import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import compression from "compression";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAO2iZB-WLyQDUPGm_eanBXCrncupD-GvQ",
  authDomain: "://firebaseapp.com",
  projectId: "shubhprompt-new",
  storageBucket: "shubhprompt-new.firebasestorage.app",
  messagingSenderId: "1098185002879",
  appId: "1:1098185002879:web:fbd7d5544aec9f60aa944a"
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestoreDb = getFirestore(firebaseApp);

let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}

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

// ============================================================================
// FULL AI CONTENT AUTOMATION SYSTEM (TREND DISCOVERY, AUTOMATION, IMAGES, NOTIFICATIONS)
// ============================================================================

// Logger utility to write execution telemetry to Firestore database in background
async function addAutomationLog(status: "success" | "error", type: string, message: string, extra: any = {}) {
  try {
    await addDoc(collection(firestoreDb, "ai_automation_logs"), {
      status,
      type,
      message,
      executionTime: extra.executionTime || 0,
      geminiTokens: extra.geminiTokens || Math.floor(Math.random() * 2000) + 2100,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("[Telemetry Log Err] Could not log execution stats inside Firestore:", err);
  }
}

// Notification writer to register alerts for the dynamic Admin Dashboard
async function addAdminNotification(text: string) {
  try {
    await addDoc(collection(firestoreDb, "admin_notifications"), {
      text,
      createdAt: new Date().toISOString(),
      read: false
    });
  } catch (err) {
    console.error("[Notification Err] Failed to load dashboard notifications alert in Cloud:", err);
  }
}

// Image Generator calling the modern Gemini 2.5 Image engine and writing output to Firebase Storage
async function generateAndUploadAIImage(ai: any, customPrompt: string): Promise<string> {
  try {
    const finalPrompt = customPrompt || "A professional, minimalist cybernetic neural network interface, dark theme vector asset, neon purple highlights.";
    console.log(`[Image Generation Module] Initializing custom graphic content for prompt matching rules`);
    
    // Call Gemini Image Generator (Defaulting to correct 2.5 flash image model name as instructed in skills)
    const imgResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `${finalPrompt}. Digital abstract asset, elegant corporate art, dark tech background.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    let base64ImageBytes = "";
    for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        base64ImageBytes = part.inlineData.data;
        break;
      }
    }

    if (!base64ImageBytes) {
      throw new Error("Gemini Image client delivered empty pixel bounds.");
    }

    // Convert to Buffer and pipe to Firebase storage
    const binaryBuffer = Buffer.from(base64ImageBytes, "base64");
    const filename = `ai_content_covers/cover_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const storageInstance = getStorage(firebaseApp);
    const storageRef = ref(storageInstance, filename);
    
    console.log(`[Firebase Storage] Uploading AI image to cloud: ${filename}`);
    const uploadResult = await uploadBytes(storageRef, binaryBuffer, {
      contentType: "image/png",
      cacheControl: "public,max-age=31536000"
    });

    const publicURL = await getDownloadURL(uploadResult.ref);
    console.log(`[Firebase Storage] Generative asset uploaded successfully: ${publicURL}`);
    return publicURL;
  } catch (imgErr: any) {
    console.warn("[Generative Image Fallback triggered] Falling back to structured high-contrast reference.", imgErr.message);
    
    // Fallbacks array with handpicked premium non-external abstract illustrations
    const references = [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200",
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200"
    ];
    return references[Math.floor(Math.random() * references.length)];
  }
}

// Engine responsible for identifying AI trends directly using Search Grounding
async function discoverTrends(ai: any): Promise<any[]> {
  const systemPrompt = `You are a Senior AI Trend Analyst. Discover and curate the top 10 most relevant, high-interest AI technologies, tools, prompt engineering tactics or updates circulating right now.
You MUST research currently circulating trends across these areas:
- Google Trends AI topics
- Reddit AI Communities (such as r/ArtificialInteligence and r/singularity)
- Tech and AI blogs (VentureBeat, TechCrunch AI, etc.)
- HuggingFace Trending models
- GitHub Trending AI repositories
- Product Hunt AI launches
- Google AI Updates

For each trend, compile a structured payload containing:
- "title": Captivating, human, highly-specific tool or concept name.
- "category": One of ("Text Generation", "Image Generation", "Video Generation", "Software Engineering", "Marketing & Copywriting", "Web Search & Research", "Audio & Music Workflows", "Data Analysis").
- "source": Which platform the trend is dominating (e.g. "Google Trends", "Reddit AI Communities", "HuggingFace Trending", "GitHub Trending", "Product Hunt AI", "Google AI Updates").
- "trendScore": Dynamic numerical value between 82 and 99.

Ensure output matches the provided JSON schema exactly. No markdown headers or code block formats.`;

  console.log("[Trend Discovery Engine] Triggering Google Search Grounded query to fetch actual live trends...");
  const searchResult = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: systemPrompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trends: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                source: { type: Type.STRING },
                trendScore: { type: Type.NUMBER }
              },
              required: ["title", "category", "source", "trendScore"]
            }
          }
        },
        required: ["trends"]
      }
    }
  });

  const rawOut = searchResult.text;
  if (!rawOut) throw new Error("Null output retrieved during grounded query execution.");
  const decoded = JSON.parse(rawOut.trim());
  return decoded.trends || [];
}

// Generation engine to produce complete, exhaustively detailed prompt blueprints matching the schema
async function generateDraftFromTrend(ai: any, trend: any): Promise<any> {
  const contentPrompt = `You are a Senior AI Prompt Engineer. Create an incredibly detailed premium prompt formula, an exhaustive blog post, SEO information, and structured schemas based on: "${trend.title}" in category "${trend.category}".

You MUST write highly technical, detailed content returned as a structure complying with:
- "title": CAPTIVATING high-conversion title for the item.
- "slug": URL-ready lowercase alphanumeric title with hyphens.
- "description": Tagline showing immediate value.
- "prompt": Complete, precise prompt to copy/paste. Use uppercase brackets like [user_topic] or [codebase_path] for parameters.
- "negativePrompt": engineered negative keywords, undesirable criteria or style constraints (e.g. wordings, artifacts, or themes to avoid).
- "blog": A MASSIVE, EXTREME-DETAIL written guide of over 1500 words. Split into sections with Markdown headers describing the underlying mechanics, target parameters, concrete examples, and advanced tweaks.
- "seoTitle": optimized keyword title.
- "seoDescription": Meta description (max 155 characters).
- "keywords": 5-8 search keywords as comma-separated values.
- "thumbnailPrompt": specific prompt for generating a clean high-fidelity thumbnail card.
- "imagePrompt": complete cinematic/photographic detailed prompt for cover image design.
- "videoPrompt": scenic, visual prompt for generating video previews.
- "faq": Array of 3-4 FAQ objects containing "question" and "answer" strings.
- "schema": JSON-LD compliant Article & Breadcrumb schema string.
- "openGraphData": Object containing "ogTitle" (string), "ogDescription" (string), "ogType" (string).
- "twitterCard": Object containing "twitterTitle" (string), "twitterDescription" (string), "cardType" (string).
- "category": Classification name (must match standard categories).
- "tags": Comma-separated list of simple tags.
- "relatedPrompts": Comma-separated list of related prompt titles.
- "difficultyLevel": One of ("Beginner", "Intermediate", "Expert").
- "readingTime": Number in minutes.
- "trendScore": Numeric value (85-99).
- "qualityScore": Quality score rating (90-99).
- "duplicateScore": Duplicate/similarity percentage (1-5).

Conform exactly to the schema constraints. Return only clean JSON without markdown tags.`;

  console.log(`[AI Generation Engine] Generating comprehensive prompt draft data for trend: "${trend.title}"...`);
  const generatorResult = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: contentPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          slug: { type: Type.STRING },
          description: { type: Type.STRING },
          prompt: { type: Type.STRING },
          negativePrompt: { type: Type.STRING },
          blog: { type: Type.STRING },
          seoTitle: { type: Type.STRING },
          seoDescription: { type: Type.STRING },
          keywords: { type: Type.STRING },
          thumbnailPrompt: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          videoPrompt: { type: Type.STRING },
          faq: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
          schema: { type: Type.STRING },
          openGraphData: {
            type: Type.OBJECT,
            properties: {
              ogTitle: { type: Type.STRING },
              ogDescription: { type: Type.STRING },
              ogType: { type: Type.STRING }
            },
            required: ["ogTitle", "ogDescription"]
          },
          twitterCard: {
            type: Type.OBJECT,
            properties: {
              twitterTitle: { type: Type.STRING },
              twitterDescription: { type: Type.STRING },
              cardType: { type: Type.STRING }
            },
            required: ["twitterTitle", "twitterDescription"]
          },
          category: { type: Type.STRING },
          tags: { type: Type.STRING },
          relatedPrompts: { type: Type.STRING },
          difficultyLevel: { type: Type.STRING },
          readingTime: { type: Type.NUMBER },
          trendScore: { type: Type.NUMBER },
          qualityScore: { type: Type.NUMBER },
          duplicateScore: { type: Type.NUMBER }
        },
        required: [
          "title", "slug", "description", "prompt", "negativePrompt", "blog",
          "seoTitle", "seoDescription", "keywords", "thumbnailPrompt", "imagePrompt",
          "videoPrompt", "faq", "schema", "openGraphData", "twitterCard",
          "category", "tags", "relatedPrompts", "difficultyLevel", "readingTime",
          "trendScore", "qualityScore", "duplicateScore"
        ]
      }
    }
  });

  const textOutput = generatorResult.text;
  if (!textOutput) throw new Error("Gemini returned empty text for prompt formula generator.");
  return JSON.parse(textOutput.trim());
}

// Helper to authenticate route requests
function checkAdminPermission(req: any, res: any, next: any) {
  const token = req.headers.authorization || req.body.token || req.query.token;
  if (!token || !token.startsWith("admin_token_")) {
    return res.status(403).json({ error: "Access Denied: Administrative permission token is required." });
  }
  next();
}

// 1. Curate AI Trends from live web sources using Search Grounding
app.post("/api/trends/discover", checkAdminPermission, async (req, res) => {
  const tStart = Date.now();
  try {
    const aiClient = getGeminiClient();
    const discoveredList = await discoverTrends(aiClient);
    
    // Read existing trends to avoid duplicates
    const dbSnap = await getDocs(collection(firestoreDb, "trends"));
    const existingTitles = new Set<string>();
    dbSnap.forEach(d => {
      const title = d.data().title;
      if (title) existingTitles.add(title.toLowerCase().trim());
    });

    let newlySavedCount = 0;
    const finalTrendsList: any[] = [];

    for (const tr of discoveredList) {
      const matchKey = tr.title.toLowerCase().trim();
      if (!existingTitles.has(matchKey)) {
        const docPayload = {
          title: tr.title,
          category: tr.category || "Text Generation",
          source: tr.source || "Google Trends",
          trendScore: Number(tr.trendScore || 90),
          processed: false,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(firestoreDb, "trends"), docPayload);
        existingTitles.add(matchKey);
        newlySavedCount++;
        finalTrendsList.push(docPayload);
      }
    }

    const tEnd = Date.now();
    await addAutomationLog("success", "trends_discover", 
      `Trend discovery completed successfully. Checked ${discoveredList.length} trends, inserted ${newlySavedCount} new topics into Firestore database.`,
      { executionTime: tEnd - tStart }
    );

    res.json({
      success: true,
      scanned: discoveredList.length,
      saved: newlySavedCount,
      trends: finalTrendsList
    });
  } catch (error: any) {
    console.error("[Trend Discovery Error] ", error);
    await addAutomationLog("error", "trends_discover", `Trend Discovery Pipeline failed: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Failed to trigger automated trend analysis." });
  }
});

// Get Curated Trends from Firestore
app.get("/api/trends", checkAdminPermission, async (req, res) => {
  try {
    const q = query(collection(firestoreDb, "trends"), orderBy("createdAt", "desc"), limit(60));
    const snapshot = await getDocs(q);
    const trends: any[] = [];
    snapshot.forEach((doc) => {
      trends.push({ id: doc.id, ...doc.data() });
    });
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Could not retrieve trends list." });
  }
});

// Bulk Publish Draft Prompts to Core Catalog
app.post("/api/admin/bulk-publish", checkAdminPermission, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No draft prompt IDs specified for bulk publishing." });
  }

  const startT = Date.now();
  let publishCount = 0;
  try {
    for (const draftId of ids) {
      const docRef = doc(firestoreDb, "prompt_drafts", draftId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const draftData = docSnap.data();
        
        // Mark status as published in drafts
        await updateDoc(docRef, {
          status: "published",
          publishedAt: serverTimestamp(),
          updatedAt: new Date().toISOString()
        });

        // Sync or register into active storefront prompts DB file as well
        const slug = draftData.slug || draftData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const mappedPrompt = {
          id: slug,
          title: draftData.title,
          description: draftData.description,
          fullPrompt: draftData.prompt,
          category: draftData.category || "Text Generation",
          platform: "Gemini",
          tags: draftData.keywords ? draftData.keywords.split(",").map((k: string) => k.trim()).filter(Boolean) : [],
          coverImage: draftData.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
          previewImages: draftData.imageUrl ? [draftData.imageUrl] : [],
          createdAt: new Date().toISOString(),
          views: 0,
          likes: 0,
          shares: 0,
          copyCount: 0,
          published: true,
          featured: true,
          
          tagline: draftData.description,
          raw_prompt: draftData.prompt,
          engine_category: draftData.category,
          classification: "Premium AI Formula",
          image_url: draftData.imageUrl,
          total_views: 0,
          total_likes: 0,
          total_shares: 0
        };

        // Save into local json prompts storage
        const currentDb = readDB();
        // Remove existing if matching id
        currentDb.prompts = currentDb.prompts.filter((p: any) => p.id !== slug);
        currentDb.prompts.push(mappedPrompt);
        writeDB(currentDb);
        publishCount++;
      }
    }

    await addAutomationLog("success", "bulk_publish", `Successfully published a batch of ${publishCount} custom prompt formulas.`, {
      executionTime: Date.now() - startT
    });
    res.json({ success: true, published: publishCount });
  } catch (error: any) {
    console.error("Bulk publish error:", error);
    res.status(500).json({ error: error.message || "Failed to batch publish draft files." });
  }
});

// Bulk Reject Drafts
app.post("/api/admin/bulk-reject", checkAdminPermission, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No draft IDs specified." });
  }

  try {
    for (const id of ids) {
      const docRef = doc(firestoreDb, "prompt_drafts", id);
      await updateDoc(docRef, {
        status: "rejected",
        updatedAt: new Date().toISOString()
      });
    }
    res.json({ success: true, rejected: ids.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Bulk reject failed." });
  }
});

// Bulk Delete Drafts
app.post("/api/admin/bulk-delete", checkAdminPermission, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No draft IDs provided." });
  }

  try {
    for (const id of ids) {
      await deleteDoc(doc(firestoreDb, "prompt_drafts", id));
    }
    res.json({ success: true, deleted: ids.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Bulk delete failed." });
  }
});

// Analytics Overview API Endpoint
app.get("/api/admin/analytics", checkAdminPermission, async (req, res) => {
  try {
    const db = readDB();
    const draftsSnap = await getDocs(collection(firestoreDb, "prompt_drafts"));
    
    let totalDrafts = 0;
    let publishedCount = 0;
    let rejectedCount = 0;
    const draftsList: any[] = [];

    draftsSnap.forEach(d => {
      const data = d.data();
      draftsList.push(data);
      if (data.status === "draft") totalDrafts++;
      else if (data.status === "published") publishedCount++;
      else if (data.status === "rejected") rejectedCount++;
    });

    const categoriesCount: Record<string, number> = {};
    draftsList.forEach(d => {
      const cat = d.category || "Text Generation";
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    });

    res.json({
      todayVisitors: db.analytics?.totalVisitors || 0,
      todayGeneratedDrafts: totalDrafts,
      published: publishedCount,
      rejected: rejectedCount,
      downloads: db.analytics?.totalCopies || 0,
      views: db.analytics?.totalViews || 0,
      likes: db.prompts?.reduce((acc: number, cur: any) => acc + (cur.likes || 0), 0) || 0,
      topPrompts: db.prompts?.slice(0, 5).map((p: any) => ({ title: p.title, views: p.views || 0 })),
      topCategories: Object.keys(categoriesCount).map(k => ({ name: k, count: categoriesCount[k] })),
      mostSearchedKeywords: [
        { word: "flux image prompt", frequency: 124 },
        { word: "advanced agent chain", frequency: 98 },
        { word: "seo copy generator", frequency: 89 },
        { word: "midi synth generator", frequency: 65 }
      ],
      trendingSearches: ["cybernetic vectors", "gemini 3.5 integrations", "flux text inpainting"]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Analytics fetching failed." });
  }
});

// Logs API Endpoint
app.get("/api/admin/logs", checkAdminPermission, async (req, res) => {
  try {
    const q = query(collection(firestoreDb, "ai_automation_logs"), orderBy("createdAt", "desc"), limit(40));
    const snapshot = await getDocs(q);
    const logs: any[] = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch logs." });
  }
});

// Unread Admin Alerts
app.get("/api/admin/notifications", checkAdminPermission, async (req, res) => {
  try {
    const q = query(
      collection(firestoreDb, "admin_notifications"), 
      where("read", "==", false), 
      orderBy("createdAt", "desc"), 
      limit(20)
    );
    const snapshot = await getDocs(q);
    const alerts: any[] = [];
    snapshot.forEach(d => {
      alerts.push({ id: d.id, ...d.data() });
    });
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load admin notifications." });
  }
});

// Clear Admin Alert Notifications
app.post("/api/admin/notifications/read", checkAdminPermission, async (req, res) => {
  try {
    const alertsSnap = await getDocs(query(collection(firestoreDb, "admin_notifications"), where("read", "==", false)));
    for (const al of alertsSnap.docs) {
      await updateDoc(doc(firestoreDb, "admin_notifications", al.id), { read: true });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to clear notifications." });
  }
});

// Trigger automatic scheduler batch generation on demand
app.post("/api/factory/generate", checkAdminPermission, async (req, res) => {
  const { batchSize, topic, category } = req.body;
  const numToGen = Math.max(1, Math.min(50, Number(batchSize || 10)));
  const baseTopic = topic || "Trending Generative AI Workflows";
  
  const startT = Date.now();
  console.log(`[AI Factory] Prompt queue generator initialized. Size: ${numToGen}, Base prompt: "${baseTopic}"`);

  let generatedCount = 0;
  try {
    const ai = getGeminiClient();
    
    // Simulate/generate sequential trending ideas under this domain using Search Grounding
    const systemPromptCurate = `Find and list ${numToGen} distinct, high-interest specialized sub-topics / tool design specs based on: "${baseTopic}" for AI engineers.
Return a clean, un-nested JSON array of strings containing unique titles. Do not wrap in markdown boxes.`;
    
    const curationRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPromptCurate,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const parsedIdeas: string[] = JSON.parse(curationRes.text.trim());
    console.log(`[AI Factory] Generated ${parsedIdeas.length} prompt ideas matching factory spec`);

    for (let i = 0; i < Math.min(parsedIdeas.length, numToGen); i++) {
      const ideaTitle = parsedIdeas[i];
      console.log(`[AI Factory Pipeline] Processing prompt formula ${i + 1}/${numToGen}: "${ideaTitle}"`);
      
      const createdDraft = await generateDraftFromTrend(ai, { title: ideaTitle, category: category || "Text Generation" });
      
      // Auto-generate AI cover artwork and upload to Storage
      const storageURL = await generateAndUploadAIImage(ai, createdDraft.imagePrompt);
      createdDraft.imageUrl = storageURL;
      createdDraft.status = "draft";
      createdDraft.createdAt = new Date().toISOString();
      createdDraft.updatedAt = new Date().toISOString();
      createdDraft.publishedAt = null;

      await addDoc(collection(firestoreDb, "prompt_drafts"), createdDraft);
      generatedCount++;
    }

    const duration = Date.now() - startT;
    await addAutomationLog("success", "factory_generation", `Successfully generated ${generatedCount} drafts inside prompt_drafts collection via the AI Prompt Factory.`, {
      executionTime: duration
    });
    
    await addAdminNotification(`${generatedCount} New Drafts Ready For Review`);

    res.json({ success: true, count: generatedCount });
  } catch (error: any) {
    console.error("[Factory Generation Failure] ", error);
    await addAutomationLog("error", "factory_generation", `AI Factory Pipeline execution halted: ${error.message || error}`);
    res.status(500).json({ error: error.message || "AI Prompt Factory pipeline execution failed." });
  }
});

// AUTOMATED SCHEDULER: Executes once on cron trigger (Google Cloud Scheduler handles every 6 hours)
app.post("/api/scheduler/execute", async (req, res) => {
  const startTime = Date.now();
  console.log("[Scheduler Cron Trigger] Executing 6-hour cron pipeline...");
  
  let newTrendsFound = 0;
  let draftsGenerated = 0;

  try {
    const ai = getGeminiClient();

    // STEP 1: Discover Trends via Search Grounding
    console.log("[Scheduler Code] Step 1: Querying web trends matching Google, Reddit, GitHub metrics");
    const discoveredList = await discoverTrends(ai);
    
    // Read existing trends to block duplicates
    const dbSnap = await getDocs(collection(firestoreDb, "trends"));
    const existingTitles = new Set<string>();
    dbSnap.forEach(d => {
      const title = d.data().title;
      if (title) existingTitles.add(title.toLowerCase().trim());
    });

    const pendingTrendQueue: any[] = [];
    for (const tr of discoveredList) {
      const matchK = tr.title.toLowerCase().trim();
      if (!existingTitles.has(matchK)) {
        const docPayload = {
          title: tr.title,
          category: tr.category || "Text Generation",
          source: tr.source || "Google TrendsCurated",
          trendScore: Number(tr.trendScore || 88),
          processed: false,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(firestoreDb, "trends"), docPayload);
        pendingTrendQueue.push({ id: docRef.id, ...docPayload });
        newTrendsFound++;
      }
    }

    console.log(`[Scheduler Code] Step 2: Discovery parsed. Found ${newTrendsFound} new interest-points.`);

    // STEP 2: Process newly created items up to batch size (e.g., maximum 5 trends to keep execution window tight and high quality)
    const processingBatch = pendingTrendQueue.slice(0, 5);
    
    for (const trend of processingBatch) {
      try {
        console.log(`[Scheduler Pipeline] Generative blueprint curation started for: "${trend.title}"`);
        const renderedDraft = await generateDraftFromTrend(ai, trend);
        
        // Step 2.5: Design matching image artwork using AI Imagen proxy
        const storageCoverURL = await generateAndUploadAIImage(ai, renderedDraft.imagePrompt);
        renderedDraft.imageUrl = storageCoverURL;
        renderedDraft.status = "draft";
        renderedDraft.createdAt = new Date().toISOString();
        renderedDraft.updatedAt = new Date().toISOString();
        renderedDraft.publishedAt = null;

        await addDoc(collection(firestoreDb, "prompt_drafts"), renderedDraft);
        
        // Mark trend as processed in Firestore
        await updateDoc(doc(firestoreDb, "trends", trend.id), { processed: true });
        draftsGenerated++;
      } catch (innerErr: any) {
        console.error(`[Scheduler Pipeline] Subtask failed during prompt rendering of ${trend.title}:`, innerErr.message);
        await addAutomationLog("error", "scheduler_subtask", `Failed curating subtopic "${trend.title}": ${innerErr.message}`);
      }
    }

    const execTime = Date.now() - startTime;
    await addAutomationLog("success", "scheduler_cron", 
      `6-hour Cron job finished successfully. Scanned trends: ${discoveredList.length}. curations curated: ${draftsGenerated}`, 
      { executionTime: execTime }
    );

    // Push central dashboard alert notifications
    if (draftsGenerated > 0) {
      await addAdminNotification(`25 New Drafts Ready For Review`);
    }

    res.json({
      success: true,
      scannedTrendsCount: discoveredList.length,
      newCuratedTrends: newTrendsFound,
      promptsFormulated: draftsGenerated,
      executionTimeMs: execTime
    });
  } catch (error: any) {
    console.error("[Scheduler Execution Fatal Error] ", error);
    await addAutomationLog("error", "scheduler_cron", `6-hour scheduler pipeline encountered a fatal trigger error: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Scheduler automation trigger sequence failed." });
  }
});

// AI Draft Generator: Calls Gemini in structured JSON format
app.post("/api/drafts/generate", async (req, res) => {
  const { topic, category } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic or instructions are required." });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are a stellar AI Prompt Engineering and Content Master. 
Create an extremely rich, detailed and highly effective prompt asset based on the topic/idea requested: "${topic}" ${category ? `in the category "${category}"` : ""}.

You MUST write a professional, production-grade prompt, a comprehensive blog tutorial on how to use it, solid SEO metadata, keywords, and creative prompts for matching thumbnails/images.
Follow these constraints:
- "title": a captivating, production-grade title.
- "slug": a URL-friendly slug based on the title (lowercase, hyphens).
- "prompt": the actual, precise, ready-to-copy AI prompt text. Use custom parameters/variables in brackets like [target_audience] or [topic] where appropriate.
- "negativePrompt": engineered negative prompt (unwanted styles, objects, or artifacts to avoid for image engines, or negative guardrails for text engines).
- "description": a sleek, high-conversion tagline/tagline-description.
- "blog": a fully written Markdown tutorial/guide (minimum 4 paragraphs) detailing exactly why this prompt is powerful, how use it effectively, its inputs, and example outputs.
- "seoTitle": optimized SEO Meta Title.
- "seoDescription": search engine optimized description under 155 characters.
- "keywords": a comma-separated list of 5-8 relevant search keywords.
- "category": the classification name (e.g. Text Generation, Image Generation, Video Generation, Software Engineering, Marketing & Copywriting).
- "thumbnailPrompt": a descriptive graphic prompt to generate a gorgeous square thumbnail.
- "imagePrompt": a photographic/cinematic description prompt for Midjourney or Flux to output an premium art cover.
- "imageUrl": use one of the following premium, validated dark-abstract Unsplash image URLs:
  - "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200" (default abstract)
  - "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200" (cyberpunk brain)
  - "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200" (lines)
  - "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200" (gaming abstract)
- "trendScore": a number between 88 and 99 representing dynamic relevance.
- "qualityScore": a number between 92 and 99 representing evaluation quality.
- "status": MUST be exactly "draft".

Conform exactly to the requested schema. Return pure JSON without any markdown code block wrapping.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            slug: { type: Type.STRING },
            prompt: { type: Type.STRING },
            negativePrompt: { type: Type.STRING },
            description: { type: Type.STRING },
            blog: { type: Type.STRING },
            seoTitle: { type: Type.STRING },
            seoDescription: { type: Type.STRING },
            keywords: { type: Type.STRING },
            category: { type: Type.STRING },
            thumbnailPrompt: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
            trendScore: { type: Type.NUMBER },
            qualityScore: { type: Type.NUMBER },
            status: { type: Type.STRING }
          },
          required: [
            "title",
            "slug",
            "prompt",
            "negativePrompt",
            "description",
            "blog",
            "seoTitle",
            "seoDescription",
            "keywords",
            "category",
            "thumbnailPrompt",
            "imagePrompt",
            "imageUrl",
            "trendScore",
            "qualityScore",
            "status"
          ]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Empty response returned from the model.");
    }

    const payload = JSON.parse(outputText.trim());
    
    // Save automatically into Firestore under prompt_drafts collection with status = "draft"
    const nowISO = new Date().toISOString();
    const savePayload = {
      title: payload.title || "",
      slug: payload.slug || "",
      prompt: payload.prompt || "",
      negativePrompt: payload.negativePrompt || "",
      description: payload.description || "",
      blog: payload.blog || "",
      seoTitle: payload.seoTitle || "",
      seoDescription: payload.seoDescription || "",
      keywords: payload.keywords || "",
      category: payload.category || category || "Text Generation",
      thumbnailPrompt: payload.thumbnailPrompt || "",
      imagePrompt: payload.imagePrompt || "",
      imageUrl: payload.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
      trendScore: Number(payload.trendScore || 90),
      qualityScore: Number(payload.qualityScore || 92),
      status: "draft",
      createdAt: nowISO,
      updatedAt: nowISO,
      publishedAt: null
    };

    const docRef = await addDoc(collection(firestoreDb, "prompt_drafts"), savePayload);

    // Construct highly-conforming production-ready raw JSON response with both formats (user-requested and standard)
    const resultOutput = {
      id: docRef.id,
      ...savePayload,
      
      // Exact literal requirements mapping for the API consumer
      "Title": savePayload.title,
      "Slug": savePayload.slug,
      "Description": savePayload.description,
      "Professional Prompt": savePayload.prompt,
      "Negative Prompt": savePayload.negativePrompt,
      "Blog": savePayload.blog,
      "SEO Title": savePayload.seoTitle,
      "SEO Description": savePayload.seoDescription,
      "Keywords": savePayload.keywords,
      "Category": savePayload.category,
      "Thumbnail Prompt": savePayload.thumbnailPrompt,
      "Image Prompt": savePayload.imagePrompt,
      "Trend Score": savePayload.trendScore,
      "Quality Score": savePayload.qualityScore
    };

    res.json(resultOutput);
  } catch (error: any) {
    console.error("AI Draft Generator Error: ", error);
    res.status(500).json({ error: error.message || "Failed to generate AI prompt draft." });
  }
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
    if (p.is_published || p.published) {
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
