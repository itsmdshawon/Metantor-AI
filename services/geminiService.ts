
import { GoogleGenAI } from "@google/genai";
import { AppConfig, Metadata } from "../types";
import { ADOBE_CATEGORIES, SHUTTERSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES } from "../constants";

// --- HELPER: Construct System Prompt ---
function getSystemPrompt(config: AppConfig): string {
    let platformCategoryRules = "";
    let jsonStructure = "";

    const baseJsonFields = `
        "title": "A short subject name. Style type. Context. Vector illustration", 
        "description": "A detailed sentence about the subject. Visual style details. Lighting and background info. Vector illustration", 
        "keywords": ["tag1", "tag2", "tag3"],
        "explanation": {
            "keyword_logic": "Explain in simple English why you chose these specific keywords to help people find this image.",
            "title_logic": "Explain why this title is a good match for the image and how the word count fits the target.",
            "description_logic": "Explain what details you included in the description to make it clear for buyers.",
            "sales_logic": "Explain in easy words why this metadata will help this image sell better on stock sites."
        }
    `;

    const adobeList = ADOBE_CATEGORIES.join(', ');
    const ssList = SHUTTERSTOCK_CATEGORIES.join(', ');
    const vsList = VECTORSTOCK_CATEGORIES.join(', ');

    if (config.platform === 'General') {
        platformCategoryRules = `
        MANDATORY: Choose categories EXACTLY from these lists:
        - "adobe_category": One from [${adobeList}]
        - "shutterstock_main": One from [${ssList}]
        - "shutterstock_optional": One from [${ssList}]
        - "vectorstock_primary": One from [${vsList}]
        - "vectorstock_secondary": One from [${vsList}]
        `;
        jsonStructure = `{ ${baseJsonFields}, "adobe_category": "...", "shutterstock_main": "...", "shutterstock_optional": "...", "vectorstock_primary": "...", "vectorstock_secondary": "..." }`;
    } else if (config.platform === 'Shutterstock') {
        platformCategoryRules = `MANDATORY: "shutterstock_main" and "shutterstock_optional" from [${ssList}]`;
        jsonStructure = `{ ${baseJsonFields}, "shutterstock_main": "...", "shutterstock_optional": "..." }`;
    } else if (config.platform === 'Vecteezy') {
        platformCategoryRules = `No category needed.`;
        jsonStructure = `{ ${baseJsonFields} }`;
    } else if (config.platform === 'VectorStock') {
        platformCategoryRules = `MANDATORY: "vectorstock_primary" and "vectorstock_secondary" from [${vsList}]`;
        jsonStructure = `{ ${baseJsonFields}, "vectorstock_primary": "...", "vectorstock_secondary": "..." }`;
    } else {
        platformCategoryRules = `MANDATORY: "category" from [${adobeList}]`;
        jsonStructure = `{ ${baseJsonFields}, "category": "..." }`;
    }

    return `
    ROLE: Professional Stock Metadata Expert.
    TASK: Create metadata that helps customers find and buy this vector image.

    *** CRITICAL RULE: MANDATORY SUFFIX ***
    - BOTH the "title" and the "description" MUST end with exactly: "Vector illustration"
    - Do NOT put a period (.) AFTER "Vector illustration".
    - You MUST include this suffix even if it makes the word count slightly higher than the target.

    *** SIMPLE EXPLANATIONS ***
    - In the "explanation" fields, use very simple, friendly English.
    - Explain why you chose the words you did.
    - If you are over or under the word count target, explain why (for example: "I used more words to describe the background details").

    *** IMAGE ANALYSIS ***
    - LOGO: If there is text or it looks like a brand mark, call it a LOGO. Do NOT use the word "silhouette".
    - SILHOUETTE: Only use this if the image is a solid black shape on a white background.

    *** RULES ***
    - BANNED WORDS: Do not use "stunning", "best", "perfect", or "download".
    - KEYWORDS: Use only single words. Target: ${config.kwCount} tags.
    - LENGTHS: Try to get close to Title: ${config.titleLen} words, Description: ${config.descLen} words.

    PLATFORM CATEGORIES:
    ${platformCategoryRules}

    Output JSON: ${jsonStructure}
    `;
}

function processResponse(text: string, config: AppConfig): Metadata {
    if (!text) throw new Error("Empty response from AI");
    
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    jsonStr = match ? match[0] : text;

    try {
        const parsed: Metadata = JSON.parse(jsonStr);
        
        const forceSuffix = (s: string) => {
            if (!s) return "";
            let r = s.replace(/\s+/g, ' ').trim();
            if (r.endsWith('.')) r = r.slice(0, -1);
            
            const suffix = "Vector illustration";
            const lowerR = r.toLowerCase();
            
            // If the suffix isn't there, add it with a preceding dot
            if (!lowerR.endsWith(suffix.toLowerCase())) {
                r = r + ". " + suffix;
            } else {
                // Suffix is there, but maybe case is wrong or spacing is weird
                const idx = lowerR.lastIndexOf(suffix.toLowerCase());
                r = r.substring(0, idx) + suffix;
            }
            
            // Final check: absolutely no trailing dot
            if (r.endsWith('.')) r = r.slice(0, -1);
            return r;
        };

        if (parsed.title) parsed.title = forceSuffix(parsed.title);
        if (parsed.description) parsed.description = forceSuffix(parsed.description);

        if (parsed.keywords) {
            const isLogo = parsed.title?.toLowerCase().includes('logo') || parsed.description?.toLowerCase().includes('logo');
            const words = parsed.keywords.flatMap(k => 
                k.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/)
            ).filter(w => {
                if (isLogo && w === 'silhouette') return false;
                return w.length > 2 && !['and', 'the', 'for', 'with'].includes(w);
            });
            parsed.keywords = [...new Set(words)].slice(0, config.kwCount);
        }

        return parsed;
    } catch (e) {
        throw new Error("Could not read AI response correctly. Retrying...");
    }
}

async function callGemini(model: string, apiKey: string, base64: string, prompt: string, config: AppConfig): Promise<Metadata> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }] },
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
            messages: [
                { role: "system", content: prompt }, 
                { role: "user", content: [
                    { type: "text", text: "Generate metadata." }, 
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                ]}
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
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
