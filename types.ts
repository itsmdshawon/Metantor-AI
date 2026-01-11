
export type Platform = 'General' | 'Adobe Stock' | 'Shutterstock' | 'Vecteezy' | 'VectorStock';

export type AiProvider = 'Google Gemini' | 'Groq Cloud' | 'Mistral AI';

export interface Metadata {
    title: string;
    description: string;
    keywords: string[];
    category?: string;
    adobe_category?: string;
    shutterstock_main?: string;
    shutterstock_optional?: string;
    vectorstock_primary?: string;
    vectorstock_secondary?: string;
    explanation?: {
        keyword_logic?: string;
        title_logic?: string;
        description_logic?: string;
        sales_logic?: string;
    };
}

export interface FileItem {
    id: string;
    file: File;
    previewUrl: string;
    status: 'pending' | 'processing' | 'complete' | 'error';
    metadata?: Metadata;
    errorMsg?: string;
    retryCount?: number;
}

export interface AppConfig {
    titleLen: number;
    descLen: number;
    kwCount: number;
    platform: Platform;
    useCustomPrompt: boolean;
    customPrompt: string;
    extensionMode: string;
    // AI Config
    provider: AiProvider;
    model: string;
    // Content Filters
    prefixActive: boolean;
    prefixText: string;
    suffixActive: boolean;
    suffixText: string;
    negativeTitleActive: boolean;
    negativeTitleWords: string;
    negativeKeywordsActive: boolean;
    negativeKeywordsWords: string;
}
