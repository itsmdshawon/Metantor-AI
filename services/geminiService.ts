
import { GoogleGenAI } from "@google/genai";
import { AppConfig, Metadata } from "../types";
import { ADOBE_CATEGORIES, SHUTTERSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES } from "../constants";

// --- HELPER: Construct System Prompt ---
function getSystemPrompt(config: AppConfig): string {
    let promptExtras = "";
    let jsonStructure = "";

    const baseJsonFields = `
        "title": "Subject. Style. Context (No trailing dot)", 
        "description": "Detailed Subject. Style details. Context (No trailing dot)", 
        "keywords": ["tag1", "tag2", "tag3"],
        "explanation": {
            "keyword_logic": "Explain keyword choice in simple English...",
            "title_logic": "Explain title structure reasoning. DO NOT mention word counts.",
            "description_logic": "Explain description flow. DO NOT mention word counts.",
            "sales_logic": "Explain why this sells in simple English..."
        }
    `;

    if (config.platform === 'General') {
        promptExtras = `
        4. CATEGORIES (STRICT STRING MATCHING):
           - "adobe_category": [${ADOBE_CATEGORIES.join(', ')}].
           - "shutterstock_main": [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_primary": [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": [${VECTORSTOCK_CATEGORIES.join(', ')}].
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
           - "shutterstock_main": [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
        `;
        jsonStructure = `{ ${baseJsonFields}, "shutterstock_main": "...", "shutterstock_optional": "..." }`;
    } else if (config.platform === 'Vecteezy') {
        promptExtras = `4. CATEGORY: DO NOT GENERATE.`;
        jsonStructure = `{ ${baseJsonFields} }`;
    } else if (config.platform === 'VectorStock') {
        promptExtras = `
        4. CATEGORIES (STRICT STRING MATCHING):
           - "vectorstock_primary": [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": [${VECTORSTOCK_CATEGORIES.join(', ')}].
        `;
        jsonStructure = `{ ${baseJsonFields}, "vectorstock_primary": "...", "vectorstock_secondary": "..." }`;
    } else {
        promptExtras = `4. CATEGORY (STRICT STRING MATCHING): [${ADOBE_CATEGORIES.join(', ')}].`;
        jsonStructure = `{ ${baseJsonFields}, "category": "..." }`;
    }

    return `
    ROLE: Senior Microstock Metadata Specialist.
    TASK: Analyze image style and generate high-sales metadata.

    *** CRITICAL IDENTIFICATION STEP (CHOOSE ONE CASE) ***
    
    [CASE 1: LOGO DESIGN TEMPLATE]
    - INDICATORS: Placeholder text (e.g., "Creative", "Slogan Here", "Brand Name"), logo composition.
    - RULES: 
        1. DO NOT use the word "Silhouette" in Title/Description.
        2. DO NOT use "Icon".
        3. MANDATORY Title Suffix: "Logo Design Template. Vector illustration"
        4. Keywords: branding, identity, logo, template, emblem, mark, design.
    
    [CASE 2: PURE SILHOUETTE ART]
    - INDICATORS: Solid black shape on white background. NO TEXT, NO SLOGANS.
    - RULES:
        1. Use "Silhouette" in Title and Description.
        2. MANDATORY Title Suffix: "Silhouette Illustration. Vector illustration"
        3. Keywords: silhouette, black, isolated, contour, shape.

    [CASE 3: GRAPHIC ILLUSTRATION / POD]
    - INDICATORS: Detailed artistic illustrations (not logos, not line art), often for t-shirts or prints.
    - RULES:
        1. Use "Graphic Illustration" in Title.
        2. MANDATORY Title Suffix: "Vector illustration"
        3. Keywords: graphic, illustration, print, apparel, artistic.

    [CASE 4: CONTINUOUS LINE ART]
    - INDICATORS: Minimalist thin-stroke drawings, single path lines.
    - RULES:
        1. Use "Continuous Line Drawing" in Title.
        2. Keywords: line, linear, one line, minimalist, sketch.

    *** GENERAL RULES ***
    1. NO PERIOD AT THE END of Titles or Descriptions.
    2. NO PROMOTIONAL WORDS: "download", "unique", "perfect", "stunning".
    3. SUFFIX: Every title and description MUST end with "Vector illustration".
    4. SPELLING: Copy categories EXACTLY. "Food and drink" (lowercase d), "Transport" (Adobe).

    *** TARGETS ***
    - Title: ~${config.titleLen} words.
    - Description: ~${config.descLen} words.
    - Keywords: ${config.kwCount} tags (Split phrases into single words).

    ${promptExtras}
    ${config.useCustomPrompt && config.customPrompt ? `\nCUSTOM INSTRUCTIONS: "${config.customPrompt}"\n` : ''}

    Output JSON: ${jsonStructure}
    `;
}

function processResponse(text: string, config: AppConfig): Metadata {
    if (!text) throw new Error("Empty response");
    let jsonStr = "";
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    jsonStr = match ? (Array.isArray(match) ? match[0] : match) : text;

    try {
        const parsed: Metadata = JSON.parse(jsonStr);
        const clean = (s: string) => {
            if (!s) return "";
            let r = s.replace(/\s+/g, ' ').trim();
            if (r.endsWith('.')) r = r.slice(0, -1);
            if (!r.toLowerCase().endsWith('vector illustration')) r = r + '. Vector illustration';
            r = r.replace(/\. Vector illustration\. Vector illustration/gi, '. Vector illustration');
            return r;
        };
        if (parsed.title) parsed.title = clean(parsed.title);
        if (parsed.description) parsed.description = clean(parsed.description);
        if (parsed.keywords) {
            parsed.keywords = [...new Set(parsed.keywords.flatMap(k => k.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/)).filter(w => w.length > 2))].slice(0, config.kwCount);
        }
        return parsed;
    } catch (e) {
        throw new Error("Invalid AI format");
    }
}

async function callGemini(model: string, apiKey: string, base64: string, prompt: string, config: AppConfig): Promise<Metadata> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model,
        contents: { role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }] },
        config: { responseMimeType: "application/json", temperature: 0.1 }
    });
    return processResponse(response.text || "{}", config);
}

async function callOpenAICompatible(endpoint: string, model: string, apiKey: string, base64: string, prompt: string, config: AppConfig): Promise<Metadata> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages: [{ role: "system", content: prompt }, { role: "user", content: [{ type: "text", text: "Process image." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }] }],
            temperature: 0.1
        })
    });
    if (!response.ok) throw new Error(`API Error ${response.status}`);
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
