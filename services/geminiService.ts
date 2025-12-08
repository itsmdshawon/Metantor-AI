
import { GoogleGenAI } from "@google/genai";
import { AppConfig, Metadata } from "../types";
import { ADOBE_CATEGORIES, SHUTTERSTOCK_CATEGORIES, VECTORSTOCK_CATEGORIES } from "../constants";

export async function generateMetadata(
    base64Image: string, 
    mimeType: string, 
    config: AppConfig,
    apiKey: string
): Promise<Metadata> {
    
    // Safety check for API key
    if (!apiKey) {
        throw new Error("API Key is missing. Please add a key in settings.");
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
            "keyword_logic": "Explain why these keywords were selected...",
            "title_logic": "Explain the title choice. IF YOU EXCEEDED THE WORD COUNT (${config.titleLen}), EXPLAIN WHY HERE (e.g., 'Added 2 words to complete the sentence').",
            "description_logic": "Explain the description choice. IF YOU EXCEEDED THE WORD COUNT (${config.descLen}), EXPLAIN WHY HERE.",
            "sales_logic": "How this metadata supports sales..."
        }
    `;

    if (config.platform === 'General') {
        promptExtras = `
        4. CATEGORIES (STRICT):
           - "adobe_category": CHOOSE EXACTLY ONE FROM: [${ADOBE_CATEGORIES.join(', ')}].
           - "shutterstock_main": CHOOSE EXACTLY ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": CHOOSE A SECOND DIFFERENT CATEGORY FROM THE SAME SHUTTERSTOCK LIST.
           - "vectorstock_primary": CHOOSE EXACTLY ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": CHOOSE A SECOND DIFFERENT CATEGORY FROM THE SAME VECTORSTOCK LIST.
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
           - "shutterstock_main": CHOOSE EXACTLY ONE FROM: [${SHUTTERSTOCK_CATEGORIES.join(', ')}].
           - "shutterstock_optional": CHOOSE A SECOND DIFFERENT CATEGORY FROM THE SAME LIST.
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
           - "vectorstock_primary": CHOOSE EXACTLY ONE FROM: [${VECTORSTOCK_CATEGORIES.join(', ')}].
           - "vectorstock_secondary": CHOOSE A SECOND DIFFERENT CATEGORY FROM THE SAME LIST.
        `;
        jsonStructure = `{ 
            ${baseJsonFields},
            "vectorstock_primary": "...", 
            "vectorstock_secondary": "..." 
        }`;
    } else {
        // Adobe Stock
        let singleCatInstruction = `4. Category: CHOOSE EXACTLY ONE FROM: [${ADOBE_CATEGORIES.join(', ')}].`;
        promptExtras = singleCatInstruction;
        jsonStructure = `{ ${baseJsonFields}, "category": "..." }`;
    }

    const prompt = `
    Act as a highly professional SEO expert for microstock photography.
    
    YOUR GOAL: Write perfect, easy English, SEO-friendly metadata.
    
    WRITING STYLE:
    - Simple, clear, and professional.
    - Real human language (Avoid robotic/repetitive wording).
    - Accurate and focused (No guessing, no unrelated topics).
    - SEARCH FRIENDLY: Focus on what buyers usually search for.
    - VOCABULARY: Use simple, easy-to-understand English vocabulary. Avoid complex or overly academic words.
    - ART STYLE PRECISION: Be precise with art techniques. Specifically, if the image looks like continuous or single-stroke work, prefer the term "Line Art" (e.g., "Continuous line art", "One line art") rather than just "line drawing".

    STRICT FORMATTING RULES (CRITICAL):
    - NO SPECIAL CHARACTERS allowed anywhere. Forbidden: . [] {} / ? - + * _ # @ ! ~ $ % ^ & ( ) : ; " '
    - STRICTLY ONLY Commas (,) are allowed for grammatical pauses or separating keywords.
    - DO NOT END THE TITLE OR DESCRIPTION WITH A FULL STOP/PERIOD (.).
    - SENTENCES must be complete and clear.

    INTELLECTUAL PROPERTY GUARDRAIL:
    - STRICTLY FORBIDDEN: Do not use any brand names, company names, logos, characters, or trademarked terms.
    - Do not guess names of places or people unless generic.

    STRICT GENERATION RULES:
    1. Title: Target approx ${config.titleLen} words. 
       - CRITICAL: Try to hit exactly ${config.titleLen} words, but if the thought is incomplete, YOU MUST FINISH THE SENTENCE even if it takes 12 or 13 words. 
       - NEVER leave a sentence unfinished. 
       - Explain any deviation in the 'explanation.title_logic' field.
    2. Description: Target approx ${config.descLen} words. 
       - CRITICAL: Try to hit exactly ${config.descLen} words, but if incomplete, ADD WORDS TO FINISH THE SENTENCE. 
       - NEVER leave a sentence unfinished.
       - Explain any deviation in the 'explanation.description_logic' field.
    3. Keywords: EXACTLY ${config.kwCount} keywords. 
       - MUST BE SINGLE WORDS (Unigrams). 
       - NO PHRASES. NO DUPLICATES.
       - High search value words only.
    ${promptExtras}

    ${config.useCustomPrompt && config.customPrompt ? `\nUSER CUSTOM INSTRUCTIONS (Prioritize these for style/tone):\n"${config.customPrompt}"\n` : ''}

    Return strict JSON format: ${jsonStructure}
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
