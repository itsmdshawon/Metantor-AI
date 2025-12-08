
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
    Role: SEO Expert.
    Goal: Sales.
    Lang: Simple English.
    NO trademarks.

    REQ:
    1. Title: ~${config.titleLen} words. Sentence.
    2. Description: ~${config.descLen} words. Sentence.
    3. Keywords: ${config.kwCount} words. High volume.
    ${promptExtras}

    ${config.useCustomPrompt && config.customPrompt ? `\nCUSTOM: "${config.customPrompt}"\n` : ''}

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
                temperature: 0.3
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
