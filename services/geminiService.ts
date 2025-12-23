
import { GoogleGenAI } from "@google/genai";
import { AppConfig, Metadata } from "../types";
import { ADOBE_CATEGORIES, SHUTTERSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES } from "../constants";

// --- HELPER: Construct System Prompt ---
function getSystemPrompt(config: AppConfig): string {
    let platformCategoryRules = "";
    let jsonStructure = "";

    const baseJsonFields = `
        "title": "Subject. Style. Context (No trailing dot)", 
        "description": "Detailed Subject. Style details. Context (No trailing dot)", 
        "keywords": ["tag1", "tag2", "tag3"],
        "explanation": {
            "keyword_logic": "Explain keyword choice...",
            "title_logic": "Explain title structure. DO NOT mention word counts.",
            "description_logic": "Explain description flow. DO NOT mention word counts.",
            "sales_logic": "Explain sales potential..."
        }
    `;

    // Strict strings for the prompt
    const adobeList = ADOBE_CATEGORIES.join(', ');
    const ssList = SHUTTERSTOCK_CATEGORIES.join(', ');
    const vsList = VECTORSTOCK_CATEGORIES.join(', ');

    if (config.platform === 'General') {
        platformCategoryRules = `
        MANDATORY: You MUST choose EXACT matches from these lists. No modifications!
        - "adobe_category": Choose exactly ONE from [${adobeList}]
        - "shutterstock_main": Choose exactly ONE from [${ssList}]
        - "shutterstock_optional": Choose exactly ONE from [${ssList}]
        - "vectorstock_primary": Choose exactly ONE from [${vsList}]
        - "vectorstock_secondary": Choose exactly ONE from [${vsList}]
        `;
        jsonStructure = `{ ${baseJsonFields}, "adobe_category": "...", "shutterstock_main": "...", "shutterstock_optional": "...", "vectorstock_primary": "...", "vectorstock_secondary": "..." }`;
    } else if (config.platform === 'Shutterstock') {
        platformCategoryRules = `MANDATORY: "shutterstock_main" and "shutterstock_optional" MUST be EXACT matches from [${ssList}]`;
        jsonStructure = `{ ${baseJsonFields}, "shutterstock_main": "...", "shutterstock_optional": "..." }`;
    } else if (config.platform === 'Vecteezy') {
        platformCategoryRules = `No category needed.`;
        jsonStructure = `{ ${baseJsonFields} }`;
    } else if (config.platform === 'VectorStock') {
        platformCategoryRules = `MANDATORY: "vectorstock_primary" and "vectorstock_secondary" MUST be EXACT matches from [${vsList}]`;
        jsonStructure = `{ ${baseJsonFields}, "vectorstock_primary": "...", "vectorstock_secondary": "..." }`;
    } else {
        // Adobe Stock
        platformCategoryRules = `MANDATORY: "category" MUST be an EXACT match from [${adobeList}]`;
        jsonStructure = `{ ${baseJsonFields}, "category": "..." }`;
    }

    return `
    ROLE: Elite Microstock Metadata Specialist.
    TASK: Generate metadata optimized for high-volume sales.

    *** STEP 1: VISUAL ANALYSIS ***
    - Check for TEXT/TYPE (Company, Slogan, Brand, Placeholder). 
      If present: Classify as LOGO. BANNED: Do not use the word "silhouette".
    - Check for SOLID SHAPE (Black on white, NO text).
      If present: Classify as SILHOUETTE.
    - Check for STYLE: Line art, POD graphic, or Vector illustration.

    *** STEP 2: CATEGORY SELECTION (STRICT) ***
    - YOU MUST SELECT ONLY FROM THE PROVIDED LISTS.
    - DO NOT change spelling, punctuation, or pluralization.
    - If you invent a category, the task fails.

    *** STEP 3: METADATA SPECS ***
    - SUFFIX: Title and Description MUST end with "Vector illustration".
    - NO PERIODS: Do not put a period (.) at the end of the text.
    - PROMO BANNED: No "download", "unique", "perfect", "stunning".
    - KEYWORDS: Single words only. Max ${config.kwCount}.
    - TARGETS: Title ~${config.titleLen} words, Description ~${config.descLen} words.

    *** PLATFORM LISTS ***
    ${platformCategoryRules}

    Final JSON Output: ${jsonStructure}
    `;
}

function processResponse(text: string, config: AppConfig): Metadata {
    if (!text) throw new Error("Empty response");
    
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    jsonStr = match ? match[0] : text;

    try {
        const parsed: Metadata = JSON.parse(jsonStr);
        
        const clean = (s: string) => {
            if (!s) return "";
            let r = s.replace(/\s+/g, ' ').trim();
            // Remove any trailing period before appending suffix
            if (r.endsWith('.')) r = r.slice(0, -1);
            
            const suffix = "Vector illustration";
            const lowerR = r.toLowerCase();
            if (!lowerR.endsWith(suffix.toLowerCase())) {
                r = r + ". " + suffix;
            }
            // Ensure no trailing period at the very end
            if (r.endsWith('.')) r = r.slice(0, -1);
            
            // Clean up double suffixes if AI hallucinated
            r = r.replace(/vector illustration\.? vector illustration/gi, 'Vector illustration');
            if (r.endsWith('.')) r = r.slice(0, -1);
            
            return r;
        };

        if (parsed.title) parsed.title = clean(parsed.title);
        if (parsed.description) parsed.description = clean(parsed.description);

        if (parsed.keywords) {
            const isLogo = parsed.title?.toLowerCase().includes('logo') || parsed.description?.toLowerCase().includes('logo');
            
            const words = parsed.keywords.flatMap(k => 
                k.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/)
            ).filter(w => {
                // Final safety check to keep "silhouette" out of logos
                if (isLogo && w === 'silhouette') return false;
                return w.length > 2 && !['and', 'the', 'for', 'with'].includes(w);
            });
            
            parsed.keywords = [...new Set(words)].slice(0, config.kwCount);
        }

        return parsed;
    } catch (e) {
        throw new Error("AI returned invalid JSON formatting. Please retry.");
    }
}

async function callGemini(model: string, apiKey: string, base64: string, prompt: string, config: AppConfig): Promise<Metadata> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model,
        contents: { 
            role: "user", 
            parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }] 
        },
        config: { 
            responseMimeType: "application/json", 
            temperature: 0.1 
        }
    });
    return processResponse(response.text || "{}", config);
}

async function callOpenAICompatible(endpoint: string, model: string, apiKey: string, base64: string, prompt: string, config: AppConfig): Promise<Metadata> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: prompt }, 
                { role: "user", content: [
                    { type: "text", text: "Analyze image and generate metadata JSON." }, 
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                ]}
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) throw new Error(`API Connection Failed: ${response.status}`);
    const data = await response.json();
    return processResponse(data.choices?.[0]?.message?.content || "{}", config);
}

export async function generateMetadata(base64: string, mime: string, config: AppConfig, key: string): Promise<Metadata> {
    const prompt = getSystemPrompt(config);
    if (config.provider === 'Google Gemini') return callGemini(config.model, key, base64, prompt, config);
    
    const endpoints: Record<string, string> = {
        'Groq Cloud': "https://api.groq.com/openai/v1/chat/completions",
        'xAI Grok': "https://api.x.ai/v1/chat/completions",
        'Mistral AI': "https://api.mistral.ai/v1/chat/completions"
    };
    
    return callOpenAICompatible(endpoints[config.provider], config.model, key, base64, prompt, config);
}
