
import { GoogleGenAI } from "@google/genai";
import { AppConfig, Metadata } from "../types";
import { ADOBE_CATEGORIES, SHUTTERSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES } from "../constants";

// --- HELPER: Construct System Prompt ---
function getSystemPrompt(config: AppConfig): string {
    let promptExtras = "";
    let jsonStructure = "";

    // Base JSON fields
    const baseJsonFields = `
        "title": "Subject. Style. Context (No trailing dot)", 
        "description": "Detailed Subject. Style details. Context (No trailing dot)", 
        "keywords": ["tag1", "tag2", "tag3"],
        "explanation": {
            "keyword_logic": "Explain keyword choice in simple English...",
            "title_logic": "Explain title structure and length reasoning. IMPORTANT: Do NOT mention specific numbers. Instead, explain the REASON (e.g. 'I kept it concise' or 'I included extra details for clarity').",
            "description_logic": "Explain description flow and length reasoning. IMPORTANT: Do NOT mention specific numbers. Instead, explain the REASON (e.g. 'I kept it concise' or 'I included extra details').",
            "sales_logic": "Explain sales strategy in simple English..."
        }
    `;

    // Platform-specific logic
    if (config.platform === 'General') {
        promptExtras = `
        4. CATEGORIES (STRICT STRING MATCHING):
           - "adobe_category": CHOOSE ONE FROM: [${ADOBE_CATEGORIES.join(', ')}].
           - "shutterstock_main": (Primary) CHOOSE ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": (Secondary) CHOOSE A SECOND ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_primary": (Primary) CHOOSE ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": (Secondary) CHOOSE A SECOND ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
        `;
        jsonStructure = `{ 
            ${baseJsonFields},
            "adobe_category": "...", 
            "shutterstock_main": "...",
            "shutterstock_optional": "...",
            "vectorstock_primary": "...",
            "vectorstock_secondary": "..."
        }`;
    } else if (config.platform === 'Shutterstock') {
        promptExtras = `
        4. CATEGORIES (STRICT STRING MATCHING):
           - "shutterstock_main": (Main Category) CHOOSE ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": (Optional Category) CHOOSE A SECOND ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
        `;
        jsonStructure = `{ 
            ${baseJsonFields},
            "shutterstock_main": "...", 
            "shutterstock_optional": "..." 
        }`;
    } else if (config.platform === 'Vecteezy') {
        promptExtras = `4. CATEGORY: DO NOT GENERATE A CATEGORY.`;
        jsonStructure = `{ ${baseJsonFields} }`;
    } else if (config.platform === 'VectorStock') {
        promptExtras = `
        4. CATEGORIES (STRICT STRING MATCHING):
           - "vectorstock_primary": (Primary Category) CHOOSE ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": (Secondary Category) CHOOSE A SECOND ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
        `;
        jsonStructure = `{ 
            ${baseJsonFields},
            "vectorstock_primary": "...", 
            "vectorstock_secondary": "..." 
        }`;
    } else {
        // Adobe Stock
        promptExtras = `4. CATEGORY (STRICT STRING MATCHING): CHOOSE ONE FROM: [${ADOBE_CATEGORIES.join(', ')}].`;
        jsonStructure = `{ ${baseJsonFields}, "category": "..." }`;
    }

    return `
    ROLE: Expert Stock Photography Metadata Specialist.
    SPECIALTY: High-End Stock Content (Photos, Vectors, Illustrations, Line Art, Logos, POD).
    TASK: Generate high-ranking, search-optimized metadata using the "Microstock Stacking" technique.

    *** VISUAL IDENTIFICATION & CLASSIFICATION (CRITICAL) ***
    Before generating metadata, analyze the image to identify the correct Style Case. 
    DO NOT assume everything is a silhouette. Look for visual cues like text, line weight, and composition.

    [CASE 1: LOGO DESIGN & BRANDING TEMPLATES]
    - Identify by: Presence of placeholder text (e.g., "Creative Slogan Here", "Company Name"), logo-style composition, centered marks with typography.
    - Title: [Subject] Logo Design Template. [Style: e.g. Minimalist, Luxury]. [Context]. Vector illustration
    - Description: Professional logo design template featuring a [Subject]. Branding identity mark for [Industry]. Vector illustration
    - Keywords: "logo", "branding", "identity", "mark", "template", "emblem", "design", "creative", "corporate".
    - MANDATORY SUFFIX: "Vector illustration"

    [CASE 2: PURE SILHOUETTE ART]
    - Identify by: Solid black shapes on white background WITHOUT any branding text or slogans.
    - Title: [Subject] Silhouette Illustration. [Action/Pose]. Vector illustration
    - Description: Stark high-contrast black silhouette of [Subject] isolated on white background. Vector illustration
    - Keywords: "silhouette", "black", "white", "contour", "shape", "isolated", "high contrast".
    - MANDATORY SUFFIX: "Vector illustration"

    [CASE 3: CONTINUOUS LINE ART / LINEAR DRAWINGS]
    - Identify by: Thin, unbroken strokes, usually black on white. Minimal or no fills.
    - Title: [Subject] Continuous Line Drawing. Minimalist Linear Art. Vector illustration
    - Keywords: "one line", "continuous line", "linear", "minimalist", "sketch", "outline".
    - MANDATORY SUFFIX: "Vector illustration"

    [CASE 4: POD (PRINT ON DEMAND) & GRAPHIC T-SHIRT DESIGNS]
    - Identify by: Large, detailed graphics often with artistic textures, vintage styles, or standalone subjects intended for apparel.
    - Title: [Subject] Graphic Illustration. [Style: e.g. Vintage, Retro, Streetwear]. Vector illustration
    - Keywords: "print", "apparel", "t-shirt", "graphic", "illustration", "artistic".
    - MANDATORY SUFFIX: "Vector illustration"

    [CASE 5: 3D RENDERS & RASTER ILLUSTRATIONS]
    - Identify by: Realistic depth, soft lighting, photographic textures, or digital painting styles.
    - STRICTLY NO "Vector" or "Vector illustration" in Title/Description.
    - Use "3D render", "CGI", or "Digital art" in Title.

    [CASE 6: REALISTIC PHOTOGRAPHS]
    - Identify by: Real-world camera shots.
    - NO "Vector" or "Illustration" keywords.

    *** STRICT FORMATTING & SAFETY ***
    1. NO PERIOD AT THE END of Titles or Descriptions.
    2. NO PROMOTIONAL WORDS: "download", "click", "buy", "perfect", "stunning", "amazing".
    3. CATEGORY SPELLING: Must match EXACTLY. "Food and drink" (lowercase d), "Transport" (Adobe), "Animals/Wildlife" (SS).

    *** LENGTH CONSTRAINTS ***
    - Title: ~${config.titleLen} words.
    - Description: ~${config.descLen} words.
    - Keywords: ${config.kwCount} tags (Single words only).

    ${promptExtras}

    ${config.useCustomPrompt && config.customPrompt ? `\nCUSTOM INSTRUCTIONS: "${config.customPrompt}"\n` : ''}

    Output JSON: ${jsonStructure}
    `;
}

// --- HELPER: Process & Clean AI Response ---
function processResponse(text: string, config: AppConfig): Metadata {
    if (!text) throw new Error("Empty response from AI");

    let jsonStr = "";
    const markdownMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    
    if (markdownMatch) {
        jsonStr = markdownMatch[1];
    } else {
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            jsonStr = text.substring(firstOpen, lastClose + 1);
        } else {
            jsonStr = text;
        }
    }

    let parsed: Metadata;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed JSON parse. Raw:", text);
        throw new Error("Failed to parse JSON response.");
    }

    const cleanSentence = (str: string) => {
        if (!str) return "";
        let res = str.replace(/\s+/g, ' ').trim();
        if (res.endsWith('.')) res = res.slice(0, -1);
        
        // Ensure "Vector illustration" suffix logic
        if (res.match(/Vector$/i)) res = res + ' illustration';
        res = res.replace(/Vector (art|design|graphic|drawing|image)$/i, 'Vector illustration');
        
        return res;
    };

    if (parsed.title) parsed.title = cleanSentence(parsed.title);
    if (parsed.description) parsed.description = cleanSentence(parsed.description);

    if (parsed.keywords && Array.isArray(parsed.keywords)) {
        let cleanKw: string[] = [];
        const seen = new Set<string>();
        parsed.keywords.forEach((k: string) => {
            const words = k.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
            words.forEach(w => {
                if (w.length > 2 && !seen.has(w)) {
                    cleanKw.push(w);
                    seen.add(w);
                }
            });
        });
        parsed.keywords = cleanKw.slice(0, config.kwCount);
    }

    return parsed;
}

async function callOpenAICompatible(
    endpoint: string,
    model: string,
    apiKey: string,
    base64Image: string,
    mimeType: string,
    prompt: string,
    config: AppConfig
): Promise<Metadata> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    const isGroq = config.provider === 'Groq Cloud';
    const isGroqVision = isGroq && (model.includes('vision') || model.includes('llama-3.2'));
    const effectiveMimeType = 'image/jpeg';
    
    let messages = [];
    if (isGroqVision) {
        messages = [
            {
                role: "user",
                content: [
                    { type: "text", text: `${prompt}\n\nIMPORTANT: Return ONLY valid JSON.` },
                    { type: "image_url", image_url: { url: `data:${effectiveMimeType};base64,${base64Image}` } }
                ]
            }
        ];
    } else {
        messages = [
            { role: "system", content: prompt },
            {
                role: "user",
                content: [
                    { type: "text", text: "Analyze this image and generate the required JSON metadata." },
                    { type: "image_url", image_url: { url: `data:${effectiveMimeType};base64,${base64Image}` } }
                ]
            }
        ];
    }

    const createBody = (useJsonMode: boolean) => JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.1,
        max_tokens: 4096, 
        stream: false,
        ...(useJsonMode ? { response_format: { type: "json_object" } } : {})
    });

    try {
        let response = await fetch(endpoint, {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: createBody(!isGroqVision),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        return processResponse(content, config);
    } catch (error: any) {
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function callGemini(
    model: string,
    apiKey: string,
    base64Image: string,
    mimeType: string,
    prompt: string,
    config: AppConfig
): Promise<Metadata> {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    try {
        const response = await ai.models.generateContent({
            model: model, 
            contents: {
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                ]
            },
            config: { responseMimeType: "application/json", temperature: 0.1 }
        });
        return processResponse(response.text || "{}", config);
    } catch (error: any) {
        throw error;
    }
}

export async function generateMetadata(
    base64Image: string, 
    mimeType: string, 
    config: AppConfig,
    apiKey: string
): Promise<Metadata> {
    if (!apiKey) throw new Error("API Key is missing.");
    const prompt = getSystemPrompt(config);
    switch (config.provider) {
        case 'Google Gemini':
            return callGemini(config.model, apiKey, base64Image, mimeType, prompt, config);
        case 'Groq Cloud':
            return callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", config.model, apiKey, base64Image, mimeType, prompt, config);
        case 'xAI Grok':
            return callOpenAICompatible("https://api.x.ai/v1/chat/completions", config.model, apiKey, base64Image, mimeType, prompt, config);
        case 'Mistral AI':
            return callOpenAICompatible("https://api.mistral.ai/v1/chat/completions", config.model, apiKey, base64Image, mimeType, prompt, config);
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
}
