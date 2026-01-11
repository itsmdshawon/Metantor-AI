export const ADOBE_CATEGORIES = [
    "Animals", "Buildings and Architecture", "Business", "Drinks", "The Environment", 
    "States of Mind", "Food", "Graphic Resources", "Hobbies and Leisure", "Industry", 
    "Landscapes", "Lifestyle", "People", "Plants and Flowers", "Culture and Religion", 
    "Science", "Social Issues", "Sports", "Technology", "Transport", "Travel"
];

export const SHUTTERSTOCK_CATEGORIES = [
    "Abstract", "Animals/Wildlife", "Arts", "Backgrounds/Textures", "Beauty/Fashion",
    "Buildings/Landmarks", "Business/Finance", "Celebrities", "Education", "Food and drink",
    "Healthcare/Medical", "Holidays", "Industrial", "Interiors", "Miscellaneous", "Nature",
    "Objects", "Parks/Outdoor", "People", "Religion", "Science", "Signs/Symbols",
    "Sports/Recreation", "Technology", "Transportation", "Vintage"
];

export const VECTORSTOCK_CATEGORIES = [
    "Abstract", "Animals & Wildlife", "Artistic & Experimental", "Backgrounds & Textures",
    "Beauty & Fashion", "Borders & Frames", "Buildings & Landmarks", "Business & Finance",
    "Cartoons", "Celebration & Party", "Children & Family", "Christmas", "Cityscapes",
    "Communication", "Computers", "Copy-Space", "DJ-Dance Music", "Dancing", "Design Elements",
    "Digital Media", "Document Template", "Easter", "Education", "Entertainment",
    "Flags & Ribbons", "Floral & Decorative", "Fonts & Type", "Food & Drink", "Game Assets",
    "Geographical & Maps", "Graffiti", "Graphs & Charts", "Grunge", "Halloween",
    "Healthcare & Medical", "Heraldry", "Housing", "Icon & Emblem (single)", "Icons & Emblems (sets)",
    "Industrial", "Infographics", "Interiors", "Landscapes & Nature", "Logos", "Military",
    "Miscellaneous", "Music", "Objects & Still Life", "Packaging", "Patterns (seamless)",
    "Patterns (single)", "People", "Photo-Real", "Religion", "Science", "Seasons",
    "Shopping & Retail", "Signs & Symbols", "Silhouettes", "Sports & Recreation",
    "T-Shirt Graphics", "Technology", "Telecommunications", "Transportation", "Urban Scenes",
    "User Interface", "Vacation & Travel", "Valentines Day", "Vintage", "Weddings"
];

export interface ModelOption {
    id: string;
    name: string;
    tier?: 'Free' | 'Paid';
}

export const AI_PROVIDERS: Record<string, ModelOption[]> = {
    'Google Gemini': [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Standard)', tier: 'Free' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Latest)', tier: 'Free' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (High Quality)', tier: 'Paid' },
        { id: 'gemini-flash-lite-latest', name: 'Gemini 2.5 Flash Lite (Fast)', tier: 'Free' }
    ],
    'Groq Cloud': [
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout Fast' },
        { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick HQ' }
    ],
    'Mistral AI': [
        { id: 'pixtral-12b-latest', name: 'Pixtral 12B Vision' }
    ]
};