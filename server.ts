import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Comprehensive safety settings set to BLOCK_NONE to allow translation of fiction,
// action, violence, horror, combat, and mature comic themes as requested by the user.
const UNRESTRICTED_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Helper to execute Gemini content generation with multi-model fallback and retry
async function generateContentWithFallback(params: {
  contents: any;
  config: any;
  preferredModels?: string[];
}) {
  const models = params.preferredModels || ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    // Try up to 2 attempts per model with short backoff for transient 503s
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            ...params.config,
            safetySettings: UNRESTRICTED_SAFETY_SETTINGS,
          },
        });
        if (response && response.text) {
          return { response, usedModel: model };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} attempt ${attempt} encountered error:`, err?.status || err?.message?.slice(0, 100));
        // If it's a 503 or 429, wait briefly before next try/model
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

// Comic translation endpoint
app.post('/api/translate-comic', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/png',
      sourceLang = 'Korean',
      targetLang = 'English',
      tone = 'natural comic dialogue',
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    // Clean base64 string if it contains prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const systemInstruction = `You are a professional comic, manga, and manhwa translator and typesetter for fictional graphic novels.
Fictional stories depict diverse themes including action, combat, martial arts, horror, monsters, romance, passion, slang, and dark fantasy.
Your role is to translate all dialogue, narrations, screams, and sound effects faithfully and verbatim as-is into ${targetLang}, capturing the author's exact intended emotion and intensity without censorship, moralizing, softening, or omitting any text.`;

    const prompt = `Perform complete OCR, speech bubble detection, and localized in-place translation for this comic image.

SOURCE LANGUAGE: ${sourceLang}
TARGET LANGUAGE: ${targetLang}
REQUESTED TONE: ${tone}

For EVERY speech bubble, thought bubble, narration box, shout/scream bubble, and sound effect (SFX) in the image:
1. Detect its bounding box [ymin, xmin, ymax, xmax] normalized to 0 - 1000 integers.
   - ymin: top (0-1000)
   - xmin: left (0-1000)
   - ymax: bottom (0-1000)
   - xmax: right (0-1000)
   - Encompass the text area inside the bubble cleanly so it can be covered and replaced with English.
2. Transcribe the original ${sourceLang} text verbatim.
3. Translate into authentic, punchy ${targetLang} comic dialogue matching the scene's emotion. Translate faithfully as-is.
4. Classify bubble_type: 'speech' | 'thought' | 'narration' | 'shout' | 'sfx' | 'caption'.
5. Classify shape: 'oval' | 'rectangle' | 'cloud' | 'none'.
6. Detect background color hex code 'bg_color' (usually '#ffffff' for white bubbles, '#000000' for dark boxes, or dominant backdrop color).
7. Detect text color hex code 'text_color' (usually '#000000' or '#ffffff').
8. Font style: 'normal' | 'bold' | 'italic' | 'uppercase'.
9. Assign reading_order (1, 2, 3...) in natural comic reading flow.

Return ONLY valid JSON matching this schema:
{
  "page_summary": "Brief 1-sentence summary of the panel/scene",
  "detected_blocks": [
    {
      "id": 1,
      "box_2d": [120, 350, 260, 680],
      "original_text": "...",
      "translated_text": "...",
      "bubble_type": "speech",
      "shape": "oval",
      "bg_color": "#ffffff",
      "text_color": "#000000",
      "font_style": "uppercase",
      "reading_order": 1,
      "notes": "scene note"
    }
  ]
}`;

    const { response, usedModel } = await generateContentWithFallback({
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            page_summary: {
              type: Type.STRING,
              description: 'Brief 1-sentence summary of panel or scene',
            },
            detected_blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] 0 to 1000',
                  },
                  original_text: { type: Type.STRING },
                  translated_text: { type: Type.STRING },
                  bubble_type: {
                    type: Type.STRING,
                    description: 'speech, thought, narration, shout, sfx, or caption',
                  },
                  shape: {
                    type: Type.STRING,
                    description: 'oval, rectangle, cloud, or none',
                  },
                  bg_color: { type: Type.STRING },
                  text_color: { type: Type.STRING },
                  font_style: { type: Type.STRING },
                  reading_order: { type: Type.INTEGER },
                  notes: { type: Type.STRING },
                },
                required: [
                  'id',
                  'box_2d',
                  'original_text',
                  'translated_text',
                  'bubble_type',
                  'shape',
                  'bg_color',
                  'text_color',
                  'reading_order',
                ],
              },
            },
          },
          required: ['detected_blocks'],
        },
      },
      preferredModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite'],
    });

    const responseText = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Fallback in case wrapped with markdown code block
      const match = responseText.match(/```(?:json)?([\s\S]*?)```/);
      if (match) {
        parsedData = JSON.parse(match[1].trim());
      } else {
        const jsonSub = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
        parsedData = JSON.parse(jsonSub);
      }
    }

    return res.json({
      success: true,
      page_summary: parsedData.page_summary || '',
      blocks: parsedData.detected_blocks || [],
      model: usedModel,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    let errMsg = error.message || 'Failed to process comic image';
    if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
      errMsg = 'The translation service is currently experiencing high demand. Please click Retry to re-run.';
    }
    return res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// Single bubble retranslation endpoint with safety override & fallback
app.post('/api/retranslate', async (req: Request, res: Response) => {
  try {
    const {
      original_text,
      current_translation,
      context = '',
      style = 'natural comic dialogue',
      targetLang = 'English',
    } = req.body;

    if (!original_text) {
      return res.status(400).json({ error: 'original_text is required' });
    }

    const systemInstruction = `You are a fictional comic dialogue translator. Translate the given comic line verbatim as-is without censorship or softening.`;

    const prompt = `Translate this comic dialogue from Korean into ${targetLang}.
Original Text: "${original_text}"
Current translation: "${current_translation || ''}"
Scene Context: "${context}"
Requested Tone/Style: "${style}"

Provide 3 distinct translation options suitable for comic speech bubbles:
1. "standard": Faithful, authentic comic translation
2. "dramatic": Punchy, emotive, dynamic comic phrasing
3. "casual": Colloquial, modern slang/conversational

Return JSON:
{
  "standard": "...",
  "dramatic": "...",
  "casual": "..."
}`;

    const { response } = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
      preferredModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite'],
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, options: parsed });
  } catch (error: any) {
    console.error('Retranslate error:', error);
    return res.status(500).json({ error: error.message || 'Failed to retranslate' });
  }
});

// Setup Vite middlewares for development, or static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
