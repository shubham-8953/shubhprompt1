-- ==========================================
-- SUPABASE DATABASE SCHEMA FOR SHUBHPROMPT
-- ==========================================
-- Copy and paste this script directly into the 
-- SQL Editor of your Supabase Workspace (https://supabase.com)
-- and press 'Run' to initialize all required database tables.

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    config JSONB DEFAULT '{}'::jsonb
);

-- 2. Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    "fullPrompt" TEXT,
    category TEXT,
    platform TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    "coverImage" TEXT,
    "previewImages" JSONB DEFAULT '[]'::jsonb,
    animation TEXT,
    "videoDemo" TEXT,
    "createdAt" TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    "copyCount" INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true
);

-- 3. Create guides table
CREATE TABLE IF NOT EXISTS guides (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    content TEXT,
    "featuredImage" TEXT,
    video TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    "relatedPrompts" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TEXT,
    views INTEGER DEFAULT 0
);

-- 4. Create watch_prompts table
CREATE TABLE IF NOT EXISTS watch_prompts (
    id TEXT PRIMARY KEY,
    title TEXT,
    "coverUrl" TEXT,
    "videoUrl" TEXT,
    "ytVideoId" TEXT,
    "fullPrompt" TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    views INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    "createdAt" TEXT
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_prompts ENABLE ROW LEVEL SECURITY;

-- 6. Create permissive access control policies for standard anonymous read & write
-- (Since the applet queries the database using your anonymous public key)

DROP POLICY IF EXISTS "Allow anonymous read access" ON settings;
DROP POLICY IF EXISTS "Allow anonymous write access" ON settings;
CREATE POLICY "Allow anonymous read access" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON prompts;
DROP POLICY IF EXISTS "Allow anonymous write access" ON prompts;
CREATE POLICY "Allow anonymous read access" ON prompts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON prompts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON guides;
DROP POLICY IF EXISTS "Allow anonymous write access" ON guides;
CREATE POLICY "Allow anonymous read access" ON guides FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON guides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON watch_prompts;
DROP POLICY IF EXISTS "Allow anonymous write access" ON watch_prompts;
CREATE POLICY "Allow anonymous read access" ON watch_prompts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON watch_prompts FOR ALL USING (true) WITH CHECK (true);
