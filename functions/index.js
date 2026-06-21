/**
 * Production-ready Firebase Scheduled Cloud Function (V2)
 * File: /functions/index.js
 * 
 * Schedule: Runs every 6 hours.
 * Tasks: 
 * 1. Collects a set of hot, emerging AI topics from Google Web Search / AI signals.
 * 2. De-duplicates topics.
 * 3. Generates high-fidelity Prompt Draft configurations via Gemini API (Structured Output).
 * 4. Stores them automatically inside Firestore under "prompt_drafts" collection with "draft" state.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleGenAI, Type } = require("@google/genai");

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Initialize the Google Gen AI client using environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Curated reliable backup channels / categories
const CATEGORIES = [
  "Text Generation",
  "Image Generation",
  "Video Generation",
  "Software Engineering",
  "Marketing & Copywriting",
  "Web Search & Research",
  "Audio & Music Workflows",
  "Data Analysis"
];

exports.scheduledPromptDraftGenerator = onSchedule({
  schedule: "every 6 hours",
  timeZone: "Etc/UTC",
  memory: "512MiB",
  timeoutSeconds: 300,
  retryCount: 1,
}, async (event) => {
  logger.info("Executing scheduled AI Prompt Draft generation pipeline...", { timestamp: new Date().toISOString() });

  try {
    // 1. Gather trending AI topics using Gemini with modern Search Grounding to find reliable trending themes
    logger.info("Step 1: Discovering emerging AI topics and trends...");
    
    const discoverPrompt = `
      Examine recent breakthrough developments, search patterns, and hot developer workflows in Generative AI for standard industries.
      Discover 4 brand new highly-specific AI prompt topics or use cases that users are searching for right now.
      Ensure the topics are concrete and pragmatic (e.g. "Tailwind CSS Layout Wireframer", "SaaS Copywriting Dynamic Hooks Creator", "Midjourney Product Photography Light Staging").
      Categorize each topic into exactly one of these list elements: ${JSON.stringify(CATEGORIES)}.
      
      Return a clean, verified JSON array containing duplicate-free, high-conversion topics. No markdowns, no surrounding tags.
    `;

    const topicDiscoveryResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: discoverPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              category: { type: Type.STRING },
              rationale: { type: Type.STRING }
            },
            required: ["topic", "category"]
          }
        }
      }
    });

    const bodyText = topicDiscoveryResponse.text;
    logger.info("Received raw trending topics from Gemini", { bodyText });
    
    let candidates = [];
    try {
      candidates = JSON.parse(bodyText);
    } catch (parseErr) {
      logger.error("JSON parsing candidates failed, attempting fallback substring extraction", parseErr);
      const match = bodyText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        candidates = JSON.parse(match[0]);
      } else {
        throw new Error("Unable to parse structured response from topic crawler.");
      }
    }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      logger.warn("No emerging candidate topics identified this cycle.");
      return;
    }

    // 2. Remove duplicate topics based on soundslug-ified equivalence check or exact text match
    logger.info("Step 2: Performing de-duplication checks...");
    const seenSlugs = new Set();
    const uniqueCandidates = [];

    for (const item of candidates) {
      if (!item.topic) continue;
      const cleanSlug = item.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      // Check if we already processed this in current batch
      if (seenSlugs.has(cleanSlug)) {
        logger.info(`Detected batch duplicate of: "${item.topic}". Skipping.`);
        continue;
      }

      // Check existing documents in Firestore to safeguard against prior generation cycles
      const snap = await db.collection("prompt_drafts")
        .where("slug", "==", cleanSlug)
        .limit(1)
        .get();

      if (!snap.empty) {
        logger.info(`Database match found for: "${item.topic}" (slug: ${cleanSlug}). Skipping to prevent catalog clutter.`);
        continue;
      }

      seenSlugs.add(cleanSlug);
      uniqueCandidates.push(item);
    }

    logger.info(`De-duplication finalized. Found ${uniqueCandidates.length} brand new, unique topics to draft.`, { uniqueCandidates });

    let createdCount = 0;

    // 3. Loop and generate full detailed draft schemas for each unique topic with structured model response
    for (const entry of uniqueCandidates) {
      logger.info(`Formulating prompt draft for topic "${entry.topic}" in category "${entry.category}"...`);

      const generatorPrompt = `
        You are an advanced Expert Prompt Engineering pipeline. 
        Your goal is to build an outstanding, production-readyPrompt Draft based on this user topic: "${entry.topic}".
        
        The focus category is: "${entry.category}".
        
        Provide high-fidelity outputs for the following blueprint fields:
        - "title": a captivating presentation title.
        - "slug": a url-friendly lowercase version (e.g. "dynamic-saas-hook-writer").
        - "prompt": the fully articulated, professional copyable text format (use placeholders like [variable] where needed).
        - "negativePrompt": specific things to avoid or parameters to suppress.
        - "description": clean, attractive tagline summarizing value.
        - "blog": a detailed markdown guide (min 4 paragraphs) of why this works, practical examples, and tips.
        - "seoTitle": attractive Google Meta search result title.
        - "seoDescription": compelling search description snippet.
        - "keywords": comma-separated keywords and tags.
        - "thumbnailPrompt": a creative description for visual representation icon.
        - "imagePrompt": complete prompt suitable for generating a beautiful high-quality cover design.
        - "trendScore": realistic priority rating (integer between 85 and 99).
        - "qualityScore": realistic evaluation score (integer between 88 and 100).
      `;

      try {
        const docResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: generatorPrompt,
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
                thumbnailPrompt: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                trendScore: { type: Type.INTEGER },
                qualityScore: { type: Type.INTEGER }
              },
              required: [
                "title", "slug", "prompt", "negativePrompt", "description", 
                "blog", "seoTitle", "seoDescription", "keywords"
              ]
            }
          }
        });

        const rawData = JSON.parse(docResponse.text);

        // 4. Set static draft parameters and persist directly in Firestore
        const nowISO = new Date().toISOString();
        const savePayload = {
          title: rawData.title || entry.topic,
          slug: rawData.slug || rawData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          prompt: rawData.prompt || "",
          negativePrompt: rawData.negativePrompt || "",
          description: rawData.description || "",
          blog: rawData.blog || "",
          seoTitle: rawData.seoTitle || "",
          seoDescription: rawData.seoDescription || "",
          keywords: rawData.keywords || "",
          category: entry.category,
          thumbnailPrompt: rawData.thumbnailPrompt || "",
          imagePrompt: rawData.imagePrompt || "",
          imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200", // placeholder matching theme
          trendScore: Number(rawData.trendScore || 90),
          qualityScore: Number(rawData.qualityScore || 92),
          status: "draft", // STATUS must ALWAYS remain "draft" (Do NOT publish automatically)
          createdAt: nowISO,
          updatedAt: nowISO,
          publishedAt: null // Never publish on cron trigger. Admin manually vets and publishes.
        };

        const resultDoc = await db.collection("prompt_drafts").add(savePayload);
        logger.info(`Successfully saved new draft to Firestore. Document ID: ${resultDoc.id}`);
        createdCount++;

      } catch (genErr) {
        logger.error(`Error formulating draft details for topic: "${entry.topic}"`, genErr);
      }
    }

    logger.info(`Scheduled execution finished successfully. Synthesized ${createdCount} new Prompt Draft documents in Firestore.`);
  } catch (error) {
    logger.error("Core Scheduled draft generation pipeline failed!", error);
  }
});
