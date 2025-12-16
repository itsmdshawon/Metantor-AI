
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
            "keyword_logic": "Explain...",
            "title_logic": "Explain...",
            "description_logic": "Explain...",
            "sales_logic": "Strategy..."
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

    *** CRITICAL FORMATTING RULES (ALL IMAGES) ***
    1. NO PERIOD AT THE END. Never put a full stop (.) at the very end of the Title or Description.
    2. PUNCTUATION BETWEEN SENTENCES. 
       - You MUST use periods (.) or commas (,) to separate distinct ideas/sentences.
       - DO NOT generate run-on sentences.
       - Example: "Idea one. Idea two. Idea three" (Correct)
       - Example: "Idea one Idea two Idea three" (INCORRECT - Run-on)

    *** WRITING STYLE & LOGIC (CONTENT-TYPE SPECIFIC) ***

    [CASE 1: ICONS (Single or Sets)]
    IF the image is an ICON or ICON SET:
    1. Title:
       - Structure: [Subject] [Type: "icon" or "icons set"]. [Style/Feature]. Vector illustration
       - MUST include "icon" or "icons".
       - RELEVANCE CHECK: Only use words like "logo", "app", "ui", "interface" if the image EXPLICITLY depicts a logo template, mobile application screen, or UI element.
       - IF OUTLINE/LINE STYLE: Use "editable stroke", "outline", "linear", "thin line".
       - IF FLAT/FILLED STYLE: Use "flat", "glyph", "filled", "solid".
       - MANDATORY SUFFIX: The Title MUST end with the exact phrase "Vector illustration".
       - Example: "Clock icon in trendy flat style. Time measurement symbol. Vector isolated element. Vector illustration"
    2. Description:
       - Focus strictly on the visual subject and style.
       - MANDATORY SUFFIX: The Description MUST end with the exact phrase "Vector illustration".

    [CASE 2: CONTINUOUS LINE ART]
    IF the image is Continuous One-Line Art:
    1. Title:
       - Structure: [Main Subject]. [Specific Style]. [Context]. Vector illustration
       - MUST use keywords: "continuous line drawing", "single line", "one line", "linear", "outline".
       - MANDATORY SUFFIX: The Title MUST end with the exact phrase "Vector illustration".
       - Example: "One line drawing Speech bubble vector. Communication chat messenger single line linear icon. Vector illustration"
    2. Description:
       - MANDATORY SUFFIX: The Description MUST end with the exact phrase "Vector illustration".

    [CASE 3: PHOTOS vs VECTOR ILLUSTRATIONS]
    Determine if the image is a Real Photograph or a Vector Illustration.

    IF PHOTOGRAPH (Realistic, Camera shot):
    1. Title: [Subject]. [Style/Lighting]. [Context].
       - DO NOT add "Vector illustration".
       - Example: "Smiling business woman holding tablet. Portrait in modern office. Corporate executive lifestyle"
    2. Description: [Detailed Subject]. [Lighting/Mood].
       - Example: "Senior man jogging in the park during sunrise. Backlight warm lighting. Active healthy retirement concept"

    IF VECTOR ILLUSTRATION (Cartoon, Flat, Gradient, Isometric, Hand drawn, etc.):
    1. Title: [Subject]. [Style]. [Context]. Vector illustration
       - MANDATORY SUFFIX: The Title MUST end with the exact phrase "Vector illustration".
    2. Description: [Detailed Subject]. [Style details]. Vector illustration
       - MANDATORY SUFFIX: The Description MUST end with the exact phrase "Vector illustration".

    *** KEYWORD RULES ***
    1. SINGLE WORDS ONLY. Split phrases (e.g., "line art" -> "line", "art").
    2. INCLUDE STYLE TAGS based on content type (e.g., "icon", "editable", "stroke" for icons; "continuous", "one" for line art).
    3. RELEVANCE. Only include tags that are visually present.
    
    *** LENGTH CONSTRAINTS ***
    1. Title: ~${config.titleLen} words (STRICT MAX 200 CHARACTERS).
    2. Description: ~${config.descLen} words.
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
    // REMOVED: "vector" and "illustration" to allow the mandatory suffix "Vector illustration".
    const bannedWords = [
        "download", "unique", "perfect", "ideal", "best", "creative", "click", "buy", 
        "stock", "image", "photo", "graphic", "art", "design",
        "picture", "wallpaper", "background", "high quality", "premium", "hd", "4k", 
        "stunning", "beautiful", "amazing", "concept", "conceptual", "artwork", "shot", "capture"
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
        return res;
    };

    // 1. Clean Title and Description
    if (parsed.title) parsed.title = cleanSentence(parsed.title);
    if (parsed.description) parsed.description = cleanSentence(parsed.description);

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
