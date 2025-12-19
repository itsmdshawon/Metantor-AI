
export const ADOBE_CATEGORIES = [
    "Animals", 
    "Buildings and Architecture", 
    "Business", 
    "Drinks", 
    "The Environment", 
    "States of Mind", 
    "Food", 
    "Graphic Resources", 
    "Hobbies and Leisure", 
    "Industry", 
    "Landscapes", 
    "Lifestyle", 
    "People", 
    "Plants and Flowers", 
    "Culture and Religion", 
    "Science", 
    "Social Issues", 
    "Sports", 
    "Technology", 
    "Transport", 
    "Travel"
];

export const SHUTTERSTOCK_CATEGORIES = [
    "Abstract", 
    "Animals/Wildlife", 
    "Arts", 
    "Backgrounds/Textures", 
    "Beauty/Fashion",
    "Buildings/Landmarks", 
    "Business/Finance", 
    "Celebrities", 
    "Education", 
    "Food and drink",
    "Healthcare/Medical", 
    "Holidays", 
    "Industrial", 
    "Interiors", 
    "Miscellaneous", 
    "Nature",
    "Objects", 
    "Parks/Outdoor", 
    "People", 
    "Religion", 
    "Science", 
    "Signs/Symbols",
    "Sports/Recreation", 
    "Technology", 
    "Transportation", 
    "Vintage"
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

export const AI_PROVIDERS = {
    'Google Gemini': [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fastest)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Stable)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Best Quality)' },
        { id: 'gemini-robotics-er-1.5-preview', name: 'Gemini Robotics ER 1.5 (Preview)' }
    ],
    'Groq Cloud': [
        { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11b Vision (Fast)' },
        { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90b Vision (High Quality)' },
        { id: 'llama-4-maverick-17b', name: 'Llama 4 Maverick 17b (Beta)' }
    ],
    'xAI Grok': [
        { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' }
    ],
    'Mistral AI': [
        { id: 'pixtral-12b-2409', name: 'Pixtral 12b (Vision)' },
        { id: 'mistral-small-latest', name: 'Mistral Small (Latest)' },
        { id: 'mistral-large-latest', name: 'Mistral Large (Latest)' }
    ]
};
