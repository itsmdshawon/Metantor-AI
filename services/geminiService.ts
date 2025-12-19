
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
    SPECIALTY: High-End Stock Content (Photos, Vectors, Illustrations, Line Art, Icons).
    TASK: Generate high-ranking, search-optimized metadata using the "Microstock Stacking" technique for ALL images.

    *** STRICT SAFETY RULES (NO REJECTIONS) ***
    1. NO PROMOTIONAL LANGUAGE. 
       - NEVER use words like: "download", "click", "buy", "unique", "perfect", "ideal", "best", "amazing", "stunning", "creative", "concept".
    2. NO FORMAT REFERENCES AS SUBJECT (Except the mandatory suffix).
       - Focus on visual description first.

    *** CRITICAL KEYWORD RESTRICTIONS (FALSE POSITIVES) ***
    1. "LOGO" / "ICON" / "APP" / "SYMBOL":
       - DO NOT use these words unless the image is EXPLICITLY a functional design element.
       - IF IN DOUBT, USE "Illustration" or "Drawing" INSTEAD OF "Logo".

    *** CRITICAL FORMATTING RULES (ALL IMAGES) ***
    1. NO PERIOD AT THE END. Never put a full stop (.) at the very end of the Title or Description.
    2. PUNCTUATION BETWEEN SENTENCES. You MUST use periods (.) or commas (,) to separate distinct ideas/sentences.

    *** CATEGORY SELECTION RULES (STRICT STRING MATCHING) ***
    1. YOU MUST COPY THE CATEGORY NAMES EXACTLY.
    2. Adobe list: Note "Transport" and "Drinks".
    3. Shutterstock list: Note "Food and drink" (lowercase 'd'). Do not use "Food & Drink". Note "Animals/Wildlife" (no spaces around slash).
    4. ZERO TOLERANCE FOR SPELLING ERRORS.

    *** REPORT EXPLANATION STYLE ***
    1. SIMPLE ENGLISH ONLY: Write in plain, friendly language.
    2. NO WORD COUNT NUMBERS: ONLY explain WHY (e.g. "I kept it concise to fit guidelines").

    *** WRITING STYLE & LOGIC (CONTENT-TYPE SPECIFIC) ***
    Analyze the visual style and select the appropriate CASE:

    [CASE 1: ICONS & UI ELEMENTS (VECTOR)]
    - Title/Description Suffix: "Vector illustration"
    [CASE 2: CONTINUOUS LINE ART / DRAWINGS (VECTOR)]
    - Keywords: "continuous line drawing", "single line", "linear". Suffix: "Vector illustration"
    [CASE 3: FLAT / 2D VECTOR-STYLE ILLUSTRATIONS]
    - Mandatory Title/Description Suffix: "Vector illustration"
    [CASE 4: 3D RENDERS & RASTER ILLUSTRATIONS]
    - STRICTLY NO "Vector" or "Vector illustration". Use "3D render" or "Digital art".
    [CASE 5: REALISTIC PHOTOGRAPHS]
    - NO "Vector". Focus on subject and lighting.

    *** KEYWORD RULES ***
    1. SINGLE WORDS ONLY. Split phrases (e.g., "line art" -> "line", "art").
    2. RELEVANCE. Only include visually present tags.
    
    *** LENGTH CONSTRAINTS ***
    1. Title: Target ~${config.titleLen} words.
    2. Description: Target ~${config.descLen} words.
    3. Keywords: ${config.kwCount} tags.

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
        throw new Error("Failed to parse JSON response. The AI model returned invalid format.");
    }

    // --- STRICT POST-PROCESSING CLEANUP ---
    const bannedWords = [
        "download", "unique", "perfect", "ideal", "best", "creative", "click", "buy", 
        "stock", "image", "photo", "picture", "wallpaper", "background", "high quality", 
        "premium", "hd", "4k", "stunning", "beautiful", "amazing", "concept", "conceptual", "shot", "capture"
    ];

    const cleanSentence = (str: string) => {
        if (!str) return "";
        let res = str;
        bannedWords.forEach(b => {
            const reg = new RegExp(`\\b${b}\\b`, 'gi');
            res = res.replace(reg, '');
        });
        res = res.replace(/^(A|An|The)\s+(picture|photo|image|vector|illustration)\s+of\s+/i, '');
        res = res.replace(/^This\s+(picture|photo|image|vector|illustration)\s+(shows|depicts|is)\s+/i, '');
        res = res.replace(/\s+/g, ' ').trim();

        if (res.endsWith('.')) {
            res = res.slice(0, -1);
        }

        if (res.match(/Vector$/i)) {
            res = res + ' illustration';
        }
        res = res.replace(/Vector (art|design|graphic|drawing|image)$/i, 'Vector illustration');

        return res;
    };

    if (parsed.title) parsed.title = cleanSentence(parsed.title);
    if (parsed.description) parsed.description = cleanSentence(parsed.description);

    const vectorSuffix = "Vector illustration";
    const titleIsVector = parsed.title && /Vector illustration$/i.test(parsed.title);
    const descIsVector = parsed.description && /Vector illustration$/i.test(parsed.description);

    if (titleIsVector && !descIsVector && parsed.description) {
        parsed.description = `${parsed.description}. ${vectorSuffix}`;
    }

    if (parsed.keywords && Array.isArray(parsed.keywords)) {
        let cleanKw: string[] = [];
        const seen = new Set<string>();

        parsed.keywords.forEach((k: string) => {
            const words = k.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
            words.forEach(w => {
                const isBanned = bannedWords.includes(w);
                const isStopWord = ['the', 'and', 'for', 'with', 'ing'].includes(w);
                if (w.length > 2 && !isBanned && !isStopWord && !seen.has(w)) {
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
        const initialJsonMode = !isGroqVision; 
        let response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: createBody(initialJsonMode),
            signal: controller.signal
        });

        if (response.status === 400 && initialJsonMode) {
             response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: createBody(false), 
                signal: controller.signal
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `API Error (${response.status})`;
            try {
                const errJson = JSON.parse(errorText);
                if (errJson.error && errJson.error.message) errorMessage = errJson.error.message;
            } catch(e) {}
            if (response.status === 429) throw new Error(`429: Rate Limit Exceeded`);
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("Invalid response format from Provider");
        return processResponse(content, config);
    } catch (error: any) {
        if (error.name === 'AbortError') throw new Error("Request timed out");
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
    const safeMimeType = 'image/jpeg';
    try {
        const response = await ai.models.generateContent({
            model: model, 
            contents: {
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: safeMimeType, data: base64Image } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });
        return processResponse(response.text || "{}", config);
    } catch (error: any) {
        if (error.message?.includes('429')) throw new Error("429: Rate Limit Exceeded");
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
            return callOpenAICompatible(
                "https://api.groq.com/openai/v1/chat/completions",
                config.model, 
                apiKey,
                base64Image,
                mimeType,
                prompt,
                config
            );
        case 'xAI Grok':
            return callOpenAICompatible(
                "https://api.x.ai/v1/chat/completions",
                config.model,
                apiKey,
                base64Image,
                mimeType,
                prompt,
                config
            );
        case 'Mistral AI':
            return callOpenAICompatible(
                "https://api.mistral.ai/v1/chat/completions",
                config.model,
                apiKey,
                base64Image,
                mimeType,
                prompt,
                config
            );
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
}
