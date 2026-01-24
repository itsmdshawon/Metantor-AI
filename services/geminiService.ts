import { GoogleGenAI, Type } from "@google/genai";
import { AppConfig, Metadata } from "../types";
import { ADOBE_CATEGORIES, SHUTTERSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES } from "../constants";
import { cleanText } from "../utils/helpers";

function validateCategory(val: any, list: string[], fallback: string): string {
    if (!val || typeof val !== 'string') return fallback;
    const trimmed = val.trim();
    if (list.includes(trimmed)) return trimmed;
    const match = list.find(item => item.toLowerCase() === trimmed.toLowerCase());
    if (match) return match;
    return fallback;
}

function getSystemPrompt(config: AppConfig): string {
    const adobeList = ADOBE_CATEGORIES.join(', ');
    const ssList = SHUTTERSTOCK_CATEGORIES.join(', ');
    const vsList = VECTORSTOCK_CATEGORIES.join(', ');

    let basePrompt = `
    ROLE: Expert Microstock Metadata Specialist.
    TASK: Analyze image content and generate highly accurate, SEO-optimized metadata.
    
    STRICT CATEGORY SELECTION RULES (NON-NEGOTIABLE):
    You MUST provide an entry for ALL FIVE (5) category fields. YOU MUST ONLY PICK FROM THE PROVIDED LISTS. 

    1. 'adobe_category': CHOOSE ONLY FROM: [${adobeList}]
    2. 'shutterstock_main': CHOOSE ONLY FROM: [${ssList}]
    3. 'shutterstock_optional': CHOOSE ONLY FROM: [${ssList}]
    4. 'vectorstock_primary': CHOOSE ONLY FROM: [${vsList}]
    5. 'vectorstock_secondary': CHOOSE ONLY FROM: [${vsList}]

    CRITICAL INSTRUCTION FOR TITLE GENERATION:
    - THE USER IS ALREADY PROVIDING THE PREFIX AND SUFFIX MANUALLY.
    - DO NOT INCLUDE THE PREFIX "${config.prefixActive ? config.prefixText : ''}" IN YOUR OUTPUT.
    - DO NOT INCLUDE THE SUFFIX "${config.suffixActive ? config.suffixText : ''}" IN YOUR OUTPUT.
    - YOUR TITLE MUST START WITH THE CORE DESCRIPTION IMMEDIATELY.
    - YOUR TITLE MUST END WITH THE CORE DESCRIPTION IMMEDIATELY.
    
    ${config.negativeTitleActive && config.negativeTitleWords ? `- DO NOT USE THESE WORDS IN THE TITLE: [${config.negativeTitleWords}]` : ''}
    ${config.negativeKeywordsActive && config.negativeKeywordsWords ? `- DO NOT USE THESE KEYWORDS: [${config.negativeKeywordsWords}]` : ''}

    STRICT WORD COUNT RULES:
    1. TITLE WORD COUNT: Target approx ${config.titleLen} words.
    2. DESCRIPTION WORD COUNT: Target approx ${config.descLen} words.
    3. KEYWORD COUNT: Provide EXACTLY ${config.kwCount} unique keywords.
       KEYWORD RULE: SINGLE WORDS ONLY. NO PHRASES.
    
    SEO & QUALITY RULES:
    1. LANGUAGE: Simple, searchable English. No marketing fluff.
    2. NO BANNED WORDS: elevate, premium, luxury, AI, generative, isolated, background.
    3. NO TRAILING PUNCTUATION: Titles and Descriptions must NOT end with a full stop.
    
    OUTPUT FORMAT:
    Return a valid JSON object ONLY:
    {
      "title": "string",
      "description": "string",
      "keywords": ["string", "string", ...],
      "adobe_category": "string",
      "shutterstock_main": "string",
      "shutterstock_optional": "string",
      "vectorstock_primary": "string",
      "vectorstock_secondary": "string"
    }
    `;

    if (config.useCustomPrompt && config.customPrompt.trim()) {
        basePrompt += `\n\nUSER OVERRIDE INSTRUCTIONS: ${config.customPrompt}`;
    }

    return basePrompt;
}

function finalizeMetadata(metadata: Metadata, config: AppConfig): Metadata {
    let titleRaw = (metadata.title || "").trim();
    let descRaw = (metadata.description || "").trim();
    let rawKeywords = Array.isArray(metadata.keywords) ? [...metadata.keywords] : [];
    
    const prefix = config.prefixActive ? (config.prefixText || "") : "";
    const suffix = config.suffixActive ? (config.suffixText || "") : "";

    // 1. CLEANING UTILITY
    const cleanSeparators = (str: string) => {
        return str.replace(/^[.\s:,\-_|]+/, '').replace(/[.\s:,\-_|]+$/, '').trim();
    };

    let body = cleanSeparators(titleRaw);

    // 2. THE ULTIMATE DE-DUPLICATION GATEKEEPER
    const stripTarget = (text: string, target: string) => {
        if (!target.trim()) return text;
        let result = text;
        const normalizedTarget = target.trim().toLowerCase();
        
        const variants = [
            normalizedTarget,
            normalizedTarget + ".",
            "." + normalizedTarget,
            normalizedTarget + ":",
            normalizedTarget + " -",
            "- " + normalizedTarget
        ];

        let changed = true;
        while (changed) {
            changed = false;
            const currentLower = result.toLowerCase();
            
            for (const variant of variants) {
                if (currentLower.startsWith(variant)) {
                    result = result.substring(variant.length);
                    result = cleanSeparators(result);
                    changed = true;
                }
                if (currentLower.endsWith(variant)) {
                    result = result.substring(0, result.length - variant.length);
                    result = cleanSeparators(result);
                    changed = true;
                }
            }
        }
        return result;
    };

    body = stripTarget(body, prefix);
    body = stripTarget(body, suffix);

    if (config.negativeTitleActive && config.negativeTitleWords) {
        const negWords = config.negativeTitleWords.split(',').map(w => w.trim()).filter(Boolean);
        negWords.forEach(word => {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp('\\b' + escaped + '\\b', 'gi');
            body = body.replace(regex, '').replace(/\s+/g, ' ').trim();
        });
    }

    const cleanBodyTitle = cleanText(body);
    const finalTitle = prefix + cleanBodyTitle + suffix;
    const finalDescription = cleanText(cleanSeparators(descRaw));

    let processedKeywords: string[] = [];
    rawKeywords.forEach(kw => {
        const fragments = String(kw).split(/[^a-zA-Z0-9]/);
        fragments.forEach(frag => {
            const cleanKw = frag.trim();
            if (cleanKw.length > 0) processedKeywords.push(cleanKw);
        });
    });

    let finalKeywords = [...new Set(processedKeywords)];
    if (config.negativeKeywordsActive && config.negativeKeywordsWords) {
        const negKws = config.negativeKeywordsWords.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
        finalKeywords = finalKeywords.filter(kw => !negKws.includes(kw.toLowerCase().trim()));
    }

    metadata.adobe_category = validateCategory(metadata.adobe_category, ADOBE_CATEGORIES, ADOBE_CATEGORIES[0]);
    metadata.shutterstock_main = validateCategory(metadata.shutterstock_main, SHUTTERSTOCK_CATEGORIES, SHUTTERSTOCK_CATEGORIES[0]);
    metadata.shutterstock_optional = validateCategory(metadata.shutterstock_optional, SHUTTERSTOCK_CATEGORIES, SHUTTERSTOCK_CATEGORIES[1] || SHUTTERSTOCK_CATEGORIES[0]);
    metadata.vectorstock_primary = validateCategory(metadata.vectorstock_primary, VECTORSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES[0]);
    metadata.vectorstock_secondary = validateCategory(metadata.vectorstock_secondary, VECTORSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES[1] || VECTORSTOCK_CATEGORIES[0]);

    metadata.title = finalTitle;
    metadata.description = finalDescription;
    metadata.keywords = finalKeywords.slice(0, config.kwCount);
    
    return metadata;
}

async function callOpenAICompatible(
    endpoint: string, 
    apiKey: string, 
    model: string, 
    base64: string, 
    prompt: string
): Promise<string> {
    const isMistral = endpoint.includes('mistral');
    const isPixtral = model === 'pixtral-12b-latest';
    const isMaverick = model === 'meta-llama/llama-4-maverick-17b-128e-instruct';
    
    const maxInternalRetries = isPixtral ? 10 : 5; 
    
    if (isMaverick) {
        await new Promise(r => setTimeout(r, 500));
    }

    for (let attempt = 0; attempt <= maxInternalRetries; attempt++) {
        const controller = new AbortController();
        const timeoutMs = isPixtral ? 120000 : (isMistral ? 60000 : 90000);
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs); 

        try {
            const messages = isMaverick ? [
                { role: "system", content: prompt },
                { role: "user", content: [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }] }
            ] : [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                    ]
                }
            ];

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 1000, stream: false }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.error?.message || `API Error ${response.status}`;
                
                if (attempt < maxInternalRetries && (response.status >= 500 || response.status === 429)) {
                    const delay = isPixtral ? 4000 : Math.pow(2, attempt) * 1000;
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(msg);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (attempt < maxInternalRetries && e.name !== 'AbortError') {
                const delay = isPixtral ? 4000 : Math.pow(2, attempt) * 1000;
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            if (isPixtral) {
                throw new Error("Connection failed. Please change model or try another one.");
            }
            throw e;
        }
    }
    return ""; 
}

export async function generateMetadata(base64: string, mime: string, config: AppConfig, manualApiKey?: string): Promise<Metadata> {
    const prompt = getSystemPrompt(config);
    let rawResponse = "";

    if (config.provider === 'Google Gemini') {
        const apiKey = manualApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        
        let lastError: any = null;
        for (let i = 0; i < 6; i++) {
            try {
                const response = await ai.models.generateContent({
                    model: config.model,
                    contents: {
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: 'image/jpeg', data: base64 } }
                        ]
                    },
                    config: { 
                        responseMimeType: "application/json", 
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                                adobe_category: { type: Type.STRING },
                                shutterstock_main: { type: Type.STRING },
                                shutterstock_optional: { type: Type.STRING },
                                vectorstock_primary: { type: Type.STRING },
                                vectorstock_secondary: { type: Type.STRING }
                            },
                            required: ["title", "description", "keywords", "adobe_category", "shutterstock_main", "shutterstock_optional", "vectorstock_primary", "vectorstock_secondary"]
                        },
                        temperature: 0.1 
                    }
                });
                rawResponse = response.text || "";
                
                // Final validation inside the loop to catch bad Gemini JSON (rare but possible)
                let cleanJson = rawResponse.trim();
                const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                if (jsonMatch) cleanJson = jsonMatch[0];
                let parsed: Metadata = JSON.parse(cleanJson);
                return finalizeMetadata(parsed, config);
            } catch (e: any) {
                lastError = e;
                const errMsg = e.message?.toLowerCase() || "";
                if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('safety')) break;
                await new Promise(r => setTimeout(r, 2000 * (i + 1))); 
            }
        }
        throw lastError || new Error("Invalid format from AI.");
    } else {
        // Mistral / Groq Logic with dedicated Formatting Retry Loop
        const apiKey = manualApiKey || process.env.API_KEY || "";
        if (!apiKey) throw new Error("Missing API Key");
        
        const endpoints: Record<string, string> = {
            'Groq Cloud': "https://api.groq.com/openai/v1/chat/completions",
            'Mistral AI': "https://api.mistral.ai/v1/chat/completions"
        };
        
        const maxParsingRetries = config.model === 'pixtral-12b-latest' ? 5 : 3;
        let lastParsingError: any = null;

        for (let attempt = 0; attempt < maxParsingRetries; attempt++) {
            try {
                rawResponse = await callOpenAICompatible(endpoints[config.provider], apiKey, config.model, base64, prompt);
                if (!rawResponse) throw new Error("Empty AI response");

                let cleanJson = rawResponse.trim();
                const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                if (jsonMatch) cleanJson = jsonMatch[0];
                
                let parsed: Metadata = JSON.parse(cleanJson);
                // Basic validation of fields
                if (!parsed.title || !parsed.keywords) throw new Error("Incomplete metadata");
                
                return finalizeMetadata(parsed, config);
            } catch (e) {
                lastParsingError = e;
                // If it's a JSON/Formatting error, wait briefly and retry the AI call
                if (attempt < maxParsingRetries - 1) {
                    const delay = config.model === 'pixtral-12b-latest' ? 3000 : 1000;
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
            }
        }
        throw lastParsingError || new Error("Invalid format from AI.");
    }
}