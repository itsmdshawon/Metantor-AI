
import { GoogleGenAI } from "@google/genai";
import { AppConfig, Metadata } from "../types";
import { ADOBE_CATEGORIES, SHUTTERSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES } from "../constants";

export async function generateMetadata(
    base64Image: string, 
    mimeType: string, 
    config: AppConfig,
    apiKey: string
): Promise<Metadata> {
    
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    let promptExtras = "";
    let jsonStructure = "";

    // Base structure
    const baseJsonFields = `
        "title": "...", 
        "description": "...", 
        "keywords": ["..."],
        "explanation": {
            "keyword_logic": "Explain...",
            "title_logic": "Explain...",
            "description_logic": "Explain...",
            "sales_logic": "Strategy..."
        }
    `;

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

    const prompt = `
    ROLE: Strict Microstock Metadata Specialist.
    TASK: Write safe, acceptance-ready metadata for Adobe Stock & Shutterstock.

    CRITICAL RULES (VIOLATION = REJECTION):
    1. NO PROMOTIONAL/MARKETING WORDS: STRICTLY BANNED: "download", "unique", "perfect", "ideal", "best", "creative", "concept", "graphic", "vector", "illustration", "art", "drawing", "design".
    2. KEYWORDS MUST BE SINGLE WORDS: No phrases. Example: Use "mountain", "sky" (Separate tags). DO NOT use "mountain sky". Max 1 word per keyword.
    3. LANGUAGE: Simple, plain English. Describe ONLY what is physically visible.
    4. TONE: Objective, neutral, descriptive. NOT salesy.

    REQUIREMENTS:
    1. Title: ~${config.titleLen} words. Simple sentence describing the visual subject.
    2. Description: ~${config.descLen} words. Simple sentence describing the scene/action.
    3. Keywords: ${config.kwCount} SINGLE words. Strictly relevant.
    ${promptExtras}

    ${config.useCustomPrompt && config.customPrompt ? `\nCUSTOM INSTRUCTIONS (Override defaults): "${config.customPrompt}"\n` : ''}

    Output JSON: ${jsonStructure}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: "user",
                parts: [
                    { text: prompt },
                    { 
                        inlineData: { 
                            mimeType: mimeType, 
                            data: base64Image 
                        } 
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                temperature: 0.2 // Lower temperature for stricter adherence
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        
        let parsed = JSON.parse(text);

        // --- POST-PROCESSING SAFEGUARDS ---

        // 1. Force Single-Word Keywords
        if (parsed.keywords && Array.isArray(parsed.keywords)) {
            let cleanKw: string[] = [];
            parsed.keywords.forEach((k: string) => {
                // Split any accidental phrases (e.g., "red car" -> "red", "car")
                const words = k.trim().split(/\s+/);
                words.forEach(w => {
                    // Remove non-alphanumeric chars (except hyphens if needed, but usually strictly text)
                    const clean = w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    if (clean.length > 2 && !cleanKw.includes(clean)) {
                        cleanKw.push(clean);
                    }
                });
            });
            parsed.keywords = cleanKw.slice(0, config.kwCount);
        }

        // 2. Remove Banned Marketing Words from Title/Description
        const banned = ["download", "unique", "perfect", "ideal", "best", "creative", "click", "buy"];
        const cleanString = (str: string) => {
            if (!str) return "";
            let res = str;
            banned.forEach(b => {
                const reg = new RegExp(`\\b${b}\\b`, 'gi');
                res = res.replace(reg, '');
            });
            return res.replace(/\s+/g, ' ').trim();
        };

        if (parsed.title) parsed.title = cleanString(parsed.title);
        if (parsed.description) parsed.description = cleanString(parsed.description);

        return parsed;

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
