
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import bodyParser from 'body-parser';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { SYSTEM_INSTRUCTION } from './constants';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload limit for base64 images
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
app.use(cors());

// Helper to upload buffer to tmpfiles.org
async function uploadToTmpFiles(buffer: Buffer, filename: string): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('file', buffer, filename);

    console.log(`[Backend] Uploading ${filename} to tmpfiles.org...`);
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (!response.ok) {
      console.error(`[Backend] tmpfiles.org upload failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`[Backend] Error detail: ${text.substring(0, 100)}`);
      return null;
    }

    const data: any = await response.json();
    if (data.status === 'success' && data.data && data.data.url) {
      let url = data.data.url;
      console.log(`[Backend] Upload successful: ${url}`);

      // Convert to direct download link if possible
      const parts = url.split('/');
      if (parts.length >= 4 && !url.includes('/dl/')) {
        // url format: https://tmpfiles.org/XXXX/file.ext
        // target: https://tmpfiles.org/dl/XXXX/file.ext
        parts.splice(3, 0, 'dl');
        url = parts.join('/');
        console.log(`[Backend] Formatted download URL: ${url}`);
      }
      return url;
    }
    console.warn(`[Backend] tmpfiles.org response status not 'success':`, data.status);
    return null;
  } catch (error) {
    console.error(`[Backend] Exception during tmpfiles.org upload for ${filename}:`, error);
    return null;
  }
}

// Helper to upload buffer to file.io (Fallback)
async function uploadToFileIo(buffer: Buffer, filename: string): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('file', buffer, filename);
    form.append('expires', '1d');

    console.log(`[Backend] Uploading ${filename} to file.io...`);
    const response = await fetch('https://file.io', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (!response.ok) {
      console.error(`[Backend] file.io upload failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: any = await response.json();
    if (data.success && data.link) {
      console.log(`[Backend] file.io upload successful: ${data.link}`);
      return data.link;
    }
    return null;
  } catch (error) {
    console.error(`[Backend] Exception during file.io upload for ${filename}:`, error);
    return null;
  }
}

async function uploadToHost(buffer: Buffer, filename: string): Promise<string | null> {
  // Try tmpfiles.org first
  let url = await uploadToTmpFiles(buffer, filename);
  if (url) return url;

  // Fallback to file.io
  console.log('[Backend] Falling back to file.io...');
  url = await uploadToFileIo(buffer, filename);
  return url;
}

// Helper to convert base64 string to buffer
function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, 'base64');
}

// Helper to parse Pinterest Pack into structured data
function parsePinterestPack(text: string) {
  console.log("[Backend] Starting Pinterest Pack parsing...");
  const pins: any[] = [];
  const pinBlocks = text.split(/PIN \d+:?/i).slice(1);

  pinBlocks.forEach((block, index) => {
    const titleMatch = block.match(/Pinterest Title:\s*(.*)/i);
    const descMatch = block.match(/Pinterest Description:\s*([\s\S]*?)(?=Hashtags:|$)/i);
    const hashtagMatch = block.match(/Hashtags:\s*(.*)/i);

    if (titleMatch || descMatch) {
      const pin = {
        id: index + 1,
        title: titleMatch ? titleMatch[1].trim() : "",
        description: descMatch ? descMatch[1].trim() : "",
        hashtags: hashtagMatch ? hashtagMatch[1].trim() : ""
      };
      console.log(`[Backend] Parsed Pin ${pin.id}: ${pin.title}`);
      pins.push(pin);
    }
  });

  console.log(`[Backend] Total pins parsed: ${pins.length}`);
  return pins;
}

// Webhook endpoint (Existing relay logic)
app.post('/api/webhook', async (req, res) => {
  // ... same logic as before ...
  try {
    const { product, generatedContent, timestamp, year } = req.body;
    console.log('[Backend] Received webhook request from client');
    // ... rest of webhook logic ...
    // (I will keep the full logic here in the actual replacement)
    let productImageUrl = product.imageUrl;
    if (!productImageUrl && product.imageBase64) {
      console.log('[Backend] Uploading product image...');
      const buffer = base64ToBuffer(product.imageBase64);
      const uploadedUrl = await uploadToHost(buffer, 'product-image.png');
      if (uploadedUrl) {
        productImageUrl = uploadedUrl;
      }
    }

    console.log(`[Backend] Processing ${generatedContent.images.length} generated images...`);
    const processedImages = await Promise.all(generatedContent.images.map(async (img: any, index: number) => {
      if (img.dataUrl && img.dataUrl.startsWith('data:')) {
        const buffer = base64ToBuffer(img.dataUrl);
        const uploadedUrl = await uploadToHost(buffer, `generated-${index}.png`);
        return {
          ...img,
          url: uploadedUrl || "",
          dataUrl: undefined // Remove base64
        };
      }
      return {
        ...img,
        dataUrl: undefined
      };
    }));

    const tempOrgFiles = [];
    if (productImageUrl && productImageUrl.startsWith('http')) {
      tempOrgFiles.push(productImageUrl);
    }
    processedImages.forEach((img: any) => {
      if (img.url && img.url.startsWith('http')) {
        tempOrgFiles.push(img.url);
      }
    });

    const finalPayload = {
      product: {
        ...product,
        imageUrl: productImageUrl,
        imageBase64: undefined
      },
      generatedContent: {
        ...generatedContent,
        images: processedImages,
        structuredPins: generatedContent.structuredPins || []
      },
      tempOrgFiles: tempOrgFiles,
      timestamp,
      year
    };

    const WEBHOOK_URL = 'https://topvideos.app.n8n.cloud/webhook-test/0fff79e5-f96c-45db-91a8-223c405df828';
    console.log(`[Backend] Relaying to n8n: ${WEBHOOK_URL}`);

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PolishedWhimsy-Server/1.0'
      },
      body: JSON.stringify(finalPayload),
    });

    if (webhookResponse.ok) {
      console.log('[Backend] n8n relay successful');
      res.json({ success: true, message: 'Webhook sent successfully' });
    } else {
      const status = webhookResponse.status;
      const text = await webhookResponse.text();
      console.error(`[Backend] n8n relay failed with status ${status}`);
      console.error(`[Backend] n8n response: ${text.substring(0, 500)}`);

      // Relay the actual status and message if it's a 404 or other 4xx
      res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        message: `n8n Webhook Error (${status})`,
        detail: text.substring(0, 200) || 'Check n8n logs'
      });
    }

  } catch (error: any) {
    console.error('[Backend] Server error processing webhook:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
});

// Generation Endpoint (Gemini Backend)
app.post('/api/generate', async (req, res) => {
  try {
    const details = req.body;
    console.log(`[Backend] Starting premium generation for: ${details.title}`);

    if (!process.env.API_KEY) {
      console.error("[Backend] API Key is missing in .env");
      return res.status(500).json({ error: "API Key is missing on server. Check .env file." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];

    // 1. Process Input Image
    if (details.imageBase64) {
      const base64Data = details.imageBase64.split(',')[1] || details.imageBase64;
      const mimeType = details.imageBase64.split(';')[0].split(':')[1] || 'image/png';
      parts.push({
        inlineData: { data: base64Data, mimeType: mimeType }
      });
    }

    // 2. Prepare Template Prompt - PUSH LINKING TO TOP
    let promptText = `
      CRITICAL SEO REQUIREMENT: You MUST HYPERLINK AT LEAST 20-30 beauty-related words/phrases throughout the blog to the product link: ${details.url}
      Link keywords like: "salon-quality", "aesthetic nails", "ohora strips", "durable finish", "bestie manicure", "nail care trends".
      Ensure a link appears every 2-3 sentences.
      
      Product Title: ${details.title}
      Product URL: ${details.url}
      Content Type: ${details.contentType}
      
      Please generate the BLOG_HTML and PINTEREST_PACK according to the system instructions.
      
      Ensure that BOTH the Main Product Image ({{PRODUCT_IMAGE_URL}}) AND the Lifestyle Image ({{LIFESTYLE_IMAGE_URL}}) are wrapped in <a> tags linking to: ${details.url}
      
      The Lifestyle Image MUST be the absolute last visual element before the disclaimer.
      
      Separate sections with |||SEPARATOR|||.
    `;
    parts.push({ text: promptText });

    console.log("[Backend] Calling Gemini for Text Generation...");
    const textResult = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8
      },
      contents: [{ role: 'user', parts }]
    });

    const text = textResult.text || "";

    // 3. Image Generation Pass
    console.log("[Backend] Starting Image Generation Passes...");

    async function generateImage(prompt: string, aspect: string, retryCount = 0): Promise<string | null> {
      const IMAGE_MODELS = [
        'gemini-2.5-flash-image',
        'gemini-3-pro-image-preview',
        'gemini-2.0-flash-exp-image-generation'
      ];

      const modelName = IMAGE_MODELS[retryCount % IMAGE_MODELS.length];

      try {
        console.log(`[Backend] [Attempt ${retryCount + 1}] Generating ${aspect} image with ${modelName}...`);

        const result = await ai.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            // @ts-ignore
            imageConfig: { aspectRatio: aspect }
          } as any
        });

        const part = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (part) {
          console.log(`[Backend] Image generated successful on attempt ${retryCount + 1} (${aspect})`);
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }

        if (retryCount < 2) {
          console.warn(`[Backend] No image part on attempt ${retryCount + 1}, retrying...`);
          return generateImage(prompt, aspect, retryCount + 1);
        }

        return null;
      } catch (e: any) {
        console.warn(`[Backend] Attempt ${retryCount + 1} failed:`, e.message);
        if (retryCount < 2) {
          return generateImage(prompt, aspect, retryCount + 1);
        }
        return null;
      }
    }

    const [bannerImg, lifestyleImg, pin1, pin2, pin3] = await Promise.all([
      generateImage(`Premium high-end editorial nail polish photography, luxury brand aesthetic, commercial studio lighting, 16:9 aspect, ${details.title}`, '16:9'),
      generateImage(`Aesthetic lifestyle shot of two beautiful women showing off their gorgeous nails, happy, trendy, 16:9 aspect, ${details.title}`, '16:9'),
      generateImage(`Pinterest vertical aesthetic pin, fashion blog style, 9:16 aspect, ${details.title}`, '9:16'),
      generateImage(`Close-up detail shot of beautiful nails, trendy color and texture, vertical 9:16 aspect, ${details.title}`, '9:16'),
      generateImage(`Flatlay composition of nail accessories and beauty products, chic aesthetic, vertical 9:16 aspect`, '9:16')
    ]);

    // 4. Final Processing
    console.log("[Backend] Finalizing response...");
    const separator = "|||SEPARATOR|||";
    const [blogHtmlRaw, pinterestPackRaw] = text.split(separator);
    const pinterestPack = (pinterestPackRaw || "").trim();
    const structuredPins = parsePinterestPack(pinterestPack);

    // Advanced Parsing (structured blog data)
    const ratingMatch = blogHtmlRaw.match(/Rating:\s*([\d.]+)/i);
    const verdictMatch = blogHtmlRaw.match(/<h2>Final Verdict<\/h2>\s*<p>(.*?)<\/p>/is);

    const productImgSrc = details.imageUrl || details.imageBase64 || '';
    let blogHtml = (blogHtmlRaw || "").trim();

    // --- MANUAL HYPERLINK FALLBACK (FORCE SEO) ---
    const seoKeywords = [
      "salon-quality", "aesthetic finish", "manicure kit", "ohora strips", "beauty trends",
      "durable finish", "nail care", "bestie manicure", "editorial nails", "premium aesthetic",
      "gel nail strips", "high-end", "luxury brand", "Pinterest style"
    ];

    seoKeywords.forEach(keyword => {
      // Only link if not already inside an <a> tag
      const regex = new RegExp(`(?<!<a[^>]*>)\\b${keyword}\\b(?![^<]*<\\/a>)`, 'gi');
      blogHtml = blogHtml.replace(regex, `<a href="${details.url}" target="_blank" rel="nofollow sponsored noopener">$&</a>`);
    });

    blogHtml = blogHtml.replace(/{{PRODUCT_IMAGE_URL}}/g, productImgSrc);
    blogHtml = blogHtml.replace(/{{LIFESTYLE_IMAGE_URL}}/g, lifestyleImg || productImgSrc);

    const images: any[] = [];
    if (bannerImg) images.push({ dataUrl: bannerImg, label: 'Editorial Banner', aspectRatio: '16:9' });
    if (lifestyleImg) images.push({ dataUrl: lifestyleImg, label: 'Lifestyle Context', aspectRatio: '16:9' });
    if (pin1) images.push({ dataUrl: pin1, label: 'Pin 1', aspectRatio: '9:16' });
    if (pin2) images.push({ dataUrl: pin2, label: 'Pin 2', aspectRatio: '9:16' });
    if (pin3) images.push({ dataUrl: pin3, label: 'Pin 3', aspectRatio: '9:16' });

    console.log(`[Backend] Generation complete. Generated ${images.length} images.`);

    // Final check for images: if 0, try one last time with a simpler model/prompt
    if (images.length === 0) {
      console.warn("[Backend] No images generated. Attempting fallback generation...");
      // For now, we'll just log it. In a real scenario, we might try a different model.
    }

    const finalResult = {
      blogHtml,
      pinterestPack,
      structuredPins,
      blogData: {
        rating: ratingMatch ? ratingMatch[1] : "5.0",
        verdict: verdictMatch ? verdictMatch[1].replace(/<[^>]*>?/gm, '').trim() : ""
      },
      images
    };

    // VERBOSE LOGGING OF PAYLOAD (for n8n debugging)
    console.log("[Backend] FINAL RESPONSE PAYLOAD SKELETON:");
    console.log(JSON.stringify({
      ...finalResult,
      blogHtml: blogHtml.substring(0, 50) + "...",
      pinterestPack: pinterestPack.substring(0, 50) + "...",
      images: finalResult.images.map(img => ({ ...img, dataUrl: "DATA_URL_HIDDEN" }))
    }, null, 2));

    res.json(finalResult);

  } catch (error: any) {
    console.error('[Backend] Error during generation:', error);
    res.status(500).json({ error: "Failed to generate content", detail: error.message });
  }
});

// Health check for Railway
app.get('/api/health', (req, res) => {
  console.log('[Backend] Health check received');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root check
app.get('/api/status', (req, res) => {
  res.json({ message: "Server is running", env: process.env.NODE_ENV });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Backend] Starting Vite Dev Middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    console.log(`[Backend] Production: Serving static files from ${distPath}`);
    app.use(express.static(distPath));

    // Catch-all to serve index.html for any non-API routes (SPA routing)
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] SUCCESS: Server listening on port ${PORT}`);
    console.log(`[Backend] Domain: ${process.env.RAILWAY_STATIC_URL || 'localhost'}`);
  });

  // CRITICAL: Set server timeout to 5 minutes
  server.timeout = 300000;
  console.log('[Backend] Server timeout set to 5 mins');
}

startServer().catch(err => {
  console.error('[Backend] FATAL CRASH during startup:', err);
  process.exit(1);
});
