
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
            "title_logic": "Explain title structure and length reasoning. IMPORTANT: Do NOT mention specific numbers (e.g. do not say 'I used 15 words'). Instead, explain the REASON (e.g. 'I kept it concise' or 'I included extra details for clarity').",
            "description_logic": "Explain description flow and length reasoning. IMPORTANT: Do NOT mention specific numbers. Instead, explain the REASON (e.g. 'I kept it concise' or 'I included extra details').",
            "sales_logic": "Explain sales strategy in simple English..."
        }
    `;

    // Platform-specific logic
    if (config.platform === 'General') {
        promptExtras = `
        4. CATEGORIES (STRICT):
           - "adobe_category": CHOOSE ONE FROM: [${ADOBE_CATEGORIES.join(', ')}].
           - "shutterstock_main": CHOOSE ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": CHOOSE A SECOND.
           - "vectorstock_primary": CHOOSE ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": CHOOSE A SECOND.
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
        4. CATEGORIES (STRICT):
           - "shutterstock_main": CHOOSE ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": CHOOSE A SECOND.
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
        4. CATEGORIES (STRICT):
           - "vectorstock_primary": CHOOSE ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": CHOOSE A SECOND.
        `;
        jsonStructure = `{ 
            ${baseJsonFields},
            "vectorstock_primary": "...", 
            "vectorstock_secondary": "..." 
        }`;
    } else {
        // Adobe Stock
        promptExtras = `4. Category: CHOOSE ONE FROM: [${ADOBE_CATEGORIES.join(', ')}].`;
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
       - DO NOT use these words unless the image is EXPLICITLY a functional design element (e.g., a button, a mobile app screen, a corporate logo template).
       - An artistic drawing, sketch, or illustration of an object (e.g., a flower, a car, a person) is NOT a "logo" or "app". It is an "illustration".
       - IF IN DOUBT, USE "Illustration" or "Drawing" INSTEAD OF "Logo".

    *** CRITICAL FORMATTING RULES (ALL IMAGES) ***
    1. NO PERIOD AT THE END. Never put a full stop (.) at the very end of the Title or Description.
    2. PUNCTUATION BETWEEN SENTENCES. 
       - You MUST use periods (.) or commas (,) to separate distinct ideas/sentences.
       - DO NOT generate run-on sentences.

    *** REPORT EXPLANATION STYLE (VERY IMPORTANT) ***
    1. SIMPLE ENGLISH ONLY: Write the "explanation" fields (title_logic, description_logic, etc.) in plain, friendly language.
    2. NO JARGON: Avoid technical terms. Just explain your thought process.
    3. WORD COUNT REASONING: 
       - Do NOT state numbers (e.g. "I used 24 words"). 
       - ONLY explain WHY (e.g. "I added extra details to make the sentence complete" or "I removed filler words to keep it concise").

    *** WRITING STYLE & LOGIC (CONTENT-TYPE SPECIFIC) ***
    Analyze the visual style of the image and select ONE of the following cases:

    [CASE 1: ICONS & UI ELEMENTS (VECTOR)]
    IF AND ONLY IF the image is a functional ICON or UI ELEMENT:
    1. Title: [Subject] [Type: "icon"]. [Style]. Vector illustration
       - MANDATORY SUFFIX: "Vector illustration"
    2. Description: [Details]. Vector illustration
       - MANDATORY SUFFIX: "Vector illustration" (MUST be included regardless of word count).

    [CASE 2: CONTINUOUS LINE ART / DRAWINGS (VECTOR)]
    IF the image is Line Art, Sketch, or Drawing (Black & White or Simple Color):
    1. Title: [Main Subject]. [Specific Style]. [Context]. Vector illustration
       - Use keywords: "continuous line drawing", "single line", "linear", "outline".
       - DO NOT use "logo" or "app".
       - MANDATORY SUFFIX: "Vector illustration"
    2. Description: [Details]. Vector illustration
       - MANDATORY SUFFIX: "Vector illustration" (MUST be included regardless of word count).

    [CASE 3: FLAT / 2D VECTOR-STYLE ILLUSTRATIONS]
    IF the image is a 2D Vector style (Flat, Cartoon, SVG style, Clean lines, Gradient, Isometric vector):
    1. Title: [Subject]. [Style]. [Context]. Vector illustration
       - MANDATORY SUFFIX: The Title MUST end with the exact phrase "Vector illustration".
       - DO NOT use "Vector graphic", "Vector art", or "Vector design". ONLY "Vector illustration".
    2. Description: [Detailed Subject]. [Style details]. Vector illustration
       - MANDATORY SUFFIX: The Description MUST end with the exact phrase "Vector illustration".
       - CRITICAL: You MUST include this suffix even if the description is very short.

    [CASE 4: 3D RENDERS & RASTER ILLUSTRATIONS]
    IF the image is a 3D Render, CGI, or Detailed Digital Painting (Raster/Bitmap look, soft lighting, complex textures):
    1. Title: [Subject]. [Style: e.g. "3D render", "3D illustration", "Digital art"]. [Context]
       - STRICTLY DO NOT add "Vector illustration".
       - DO NOT use the word "Vector".
    2. Description: [Detailed Subject]. [Style details]
       - STRICTLY DO NOT add "Vector illustration".

    [CASE 5: REALISTIC PHOTOGRAPHS]
    IF the image is a Real Photograph (Camera shot):
    1. Title: [Subject]. [Style/Lighting]. [Context]
       - STRICTLY DO NOT add "Vector illustration".
       - DO NOT use the word "Vector".
    2. Description: [Detailed Subject]. [Lighting/Mood]

    *** KEYWORD RULES ***
    1. SINGLE WORDS ONLY. Split phrases (e.g., "line art" -> "line", "art").
    2. INCLUDE STYLE TAGS based on content type.
    3. RELEVANCE. Only include tags that are visually present.
    
    *** LENGTH CONSTRAINTS ***
    1. Title: Target ~${config.titleLen} words. (It is okay to be +/- 5 words to ensure a complete sentence. DO NOT STOP mid-sentence).
    2. Description: Target ~${config.descLen} words. (It is okay to be +/- 5 words to ensure a complete sentence).
    3. Keywords: ${config.kwCount} tags.

    ${promptExtras}

    ${config.useCustomPrompt && config.customPrompt ? `\nCUSTOM INSTRUCTIONS (Override defaults): "${config.customPrompt}"\n` : ''}

    Output JSON: ${jsonStructure}
    `;
}

// --- HELPER: Process & Clean AI Response ---
function processResponse(text: string, config: AppConfig): Metadata {
    if (!text) throw new Error("Empty response from AI");

    // 1. Try to extract JSON from Markdown blocks
    let jsonStr = "";
    const markdownMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    
    if (markdownMatch) {
        jsonStr = markdownMatch[1];
    } else {
        // 2. If no markdown, find the first '{' and last '}'
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            jsonStr = text.substring(firstOpen, lastClose + 1);
        } else {
            // 3. Last resort, assume entire text is JSON
            jsonStr = text;
        }
    }

    let parsed: Metadata;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed JSON parse. Raw:", text, "Extracted:", jsonStr);
        throw new Error("Failed to parse JSON response. The AI model returned invalid format.");
    }

    // --- STRICT POST-PROCESSING CLEANUP ---

    // Define Banned Words (Regex-ready)
    // NOTE: Synonyms like "art", "design", "graphic" are NOT banned to prevent incomplete sentences.
    const bannedWords = [
        "download", "unique", "perfect", "ideal", "best", "creative", "click", "buy", 
        "stock", "image", "photo", 
        "picture", "wallpaper", "background", "high quality", "premium", "hd", "4k", 
        "stunning", "beautiful", "amazing", "concept", "conceptual", "shot", "capture"
    ];

    // Helper to clean a sentence
    const cleanSentence = (str: string) => {
        if (!str) return "";
        let res = str;
        // Remove banned words (case insensitive, whole word)
        bannedWords.forEach(b => {
            const reg = new RegExp(`\\b${b}\\b`, 'gi');
            res = res.replace(reg, '');
        });
        // Remove "A picture of", "This image shows", etc.
        res = res.replace(/^(A|An|The)\s+(picture|photo|image|vector|illustration)\s+of\s+/i, '');
        res = res.replace(/^This\s+(picture|photo|image|vector|illustration)\s+(shows|depicts|is)\s+/i, '');
        
        // Collapse spaces and trim
        res = res.replace(/\s+/g, ' ').trim();

        // REMOVE TRAILING PERIOD (The user explicitly requested no full stop at the end)
        if (res.endsWith('.')) {
            res = res.slice(0, -1);
        }

        // --- REPAIR LOGIC: Ensure "Vector illustration" is complete (ONLY IF VECTOR IS PRESENT) ---
        // We only trigger this if the AI output "Vector" or "Vector design". 
        // If the AI output a 3D description without "Vector", this logic stays dormant.
        
        // 1. If text ends in just "Vector" (incomplete), append " illustration".
        if (res.match(/Vector$/i)) {
            res = res + ' illustration';
        }

        // 2. If text ends in "Vector design", "Vector art", "Vector graphic" (synonyms), 
        // REPLACE it with "Vector illustration" to satisfy the specific requirement for vectors.
        res = res.replace(/Vector (art|design|graphic|drawing|image)$/i, 'Vector illustration');

        return res;
    };

    // 1. Clean Title and Description
    if (parsed.title) parsed.title = cleanSentence(parsed.title);
    if (parsed.description) parsed.description = cleanSentence(parsed.description);

    // --- CONSISTENCY ENFORCER ---
    // If the Title is marked as a Vector (ends with "Vector illustration"), 
    // we MUST enforce the Description to also end with it. 
    // This handles cases where the AI drops the suffix in description due to word count limits.
    const vectorSuffix = "Vector illustration";
    const titleIsVector = parsed.title && /Vector illustration$/i.test(parsed.title);
    const descIsVector = parsed.description && /Vector illustration$/i.test(parsed.description);

    if (titleIsVector && !descIsVector && parsed.description) {
        // Append the suffix. Ensure there is a period before it if not already valid punctuation.
        // cleanSentence removes trailing dots, so we typically add ". Vector illustration"
        // But if the description ended with "Vector" (without illustration), cleanSentence handles it above.
        // This block handles complete absence.
        
        parsed.description = `${parsed.description}. ${vectorSuffix}`;
    }

    // 2. Force Single-Word Keywords (Aggressive Splitter)
    if (parsed.keywords && Array.isArray(parsed.keywords)) {
        let cleanKw: string[] = [];
        const seen = new Set<string>();

        parsed.keywords.forEach((k: string) => {
            // Split by space, comma, hyphen, underscore to ensure single words
            const words = k.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
            
            words.forEach(w => {
                // Filter: must be > 2 chars, not a banned word, not a number, not a common stop word
                const isBanned = bannedWords.includes(w);
                const isStopWord = ['the', 'and', 'for', 'with', 'ing'].includes(w);
                
                if (w.length > 2 && !isBanned && !isStopWord && !seen.has(w)) {
                    cleanKw.push(w);
                    seen.add(w);
                }
            });
        });
        
        // Ensure we hit the target count
        parsed.keywords = cleanKw.slice(0, config.kwCount);
    }

    return parsed;
}

// --- STANDARD OPENAI-COMPATIBLE CALLER (Groq, xAI, Mistral) ---
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
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

    // IDENTIFY PROVIDER QUIRKS
    const isGroq = config.provider === 'Groq Cloud';
    // Groq's Vision models (Llama 3.2) are strict about roles and JSON mode
    const isGroqVision = isGroq && (model.includes('vision') || model.includes('llama-3.2'));
    
    // Safety check for Groq text-only models
    if (isGroq && !isGroqVision && !model.includes('llama-4')) {
         // Proceed with caution, but usually user selects vision model in UI
    }

    // FORCE JPEG MIME TYPE: 
    // The helpers.ts fileToBase64 function converts everything to JPEG.
    // We must tell the API it's a JPEG, even if the original file was PNG.
    const effectiveMimeType = 'image/jpeg';

    let messages = [];

    if (isGroqVision) {
        // GROQ VISION STRATEGY: 
        // 1. Single User Message (No System role)
        // 2. Text Content FIRST, Image Content SECOND
        // 3. NO 'response_format: json_object' (triggers 400 on Vision)
        messages = [
            {
                role: "user",
                content: [
                    { 
                        type: "text", 
                        text: `${prompt}\n\nIMPORTANT: Return ONLY valid JSON.` 
                    },
                    {
                        type: "image_url",
                        image_url: {
                            // Groq expects the full data URI
                            url: `data:${effectiveMimeType};base64,${base64Image}`
                        }
                    }
                ]
            }
        ];
    } else {
        // STANDARD STRATEGY (xAI, Mistral, Text Models)
        messages = [
            {
                role: "system",
                content: prompt
            },
            {
                role: "user",
                content: [
                    { type: "text", text: "Analyze this image and generate the required JSON metadata." },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${effectiveMimeType};base64,${base64Image}`
                        }
                    }
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
        // Groq Vision models fail hard on json_object, so default to FALSE for them.
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

        // RECOVERY: If 400 Bad Request (likely JSON mode unsupported or structure issue)
        if (response.status === 400 && initialJsonMode) {
            console.warn(`400 Error on ${model}. Retrying without JSON mode...`);
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
                if (errJson.error && errJson.error.message) {
                    errorMessage = errJson.error.message;
                }
            } catch(e) {}

            console.error("Provider Error:", errorMessage);

            if (response.status === 429) throw new Error(`429: Rate Limit Exceeded`);
            if (response.status === 400) throw new Error(`400: Bad Request. ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("Invalid response format from Provider");
        
        return processResponse(content, config);

    } catch (error: any) {
        if (error.name === 'AbortError') throw new Error("Request timed out");
        // Fallback for weird edge cases
        if (error.message && error.message.includes("'response_format' is not supported")) {
             return callOpenAICompatibleLegacy(endpoint, model, apiKey, base64Image, effectiveMimeType, prompt, config);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Fallback for legacy / stubborn models
async function callOpenAICompatibleLegacy(
    endpoint: string,
    model: string,
    apiKey: string,
    base64Image: string,
    mimeType: string,
    prompt: string,
    config: AppConfig
): Promise<Metadata> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "user", content: `${prompt}\n\nAnalyze this image and return valid JSON.` },
                {
                     role: "user",
                     content: [
                         { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                     ]
                }
            ],
            temperature: 0.1
        })
    });
    const data = await response.json();
    return processResponse(data.choices?.[0]?.message?.content || "{}", config);
}


// --- GEMINI SPECIFIC IMPLEMENTATION ---
async function callGemini(
    model: string,
    apiKey: string,
    base64Image: string,
    mimeType: string, // We ignore this because helpers.ts converts to JPEG
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
                    { 
                        inlineData: { 
                            mimeType: safeMimeType, 
                            data: base64Image 
                        } 
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });
        
        return processResponse(response.text || "{}", config);
    } catch (error: any) {
        console.error("Gemini Error:", error);
        
        if (error.message?.includes('400') || error.status === 400) {
             try {
                // Try again without JSON constraint
                const retryResponse = await ai.models.generateContent({
                    model: model,
                    contents: {
                        role: "user",
                        parts: [
                            { text: prompt + "\n\nReturn valid JSON." },
                            { inlineData: { mimeType: safeMimeType, data: base64Image } }
                        ]
                    }
                });
                return processResponse(retryResponse.text || "{}", config);
             } catch(retryErr) {
                 throw error;
             }
        }

        if (error.message?.includes('429')) throw new Error("429: Rate Limit Exceeded");
        throw error;
    }
}

// --- MAIN DISPATCHER ---
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
