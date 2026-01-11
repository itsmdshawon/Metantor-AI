import { FileItem, Metadata, Platform } from '../types';

/**
 * Strictly cleans text to allow only:
 * - Alphanumeric characters (a-z, A-Z, 0-9)
 * - Spaces
 * - Commas (,)
 * - Full stops (.)
 * - Apostrophes and Single Quotes (', ’, ‘, ‛, ‚)
 * All other symbols are replaced with a single space.
 * This preserves contractions like "don't", "it's", and possessives like "person's".
 */
export function cleanText(text: any): string {
    if (text === undefined || text === null) return "";
    const s = typeof text === 'string' ? text : String(text);
    
    // Regexp specifically allowing letters, numbers, spaces, commas, periods, and a variety of single-quote characters.
    // \u2018 is ‘, \u2019 is ’, \u201A is ‚, \u201B is ‛, \u0027 is '
    let cleaned = s.replace(/[^a-zA-Z0-9\s,.\u2018\u2019\u201A\u201B\u0027']/g, ' ');
    
    // Collapse multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const MAX_SIZE = 800; 
                let width = img.width;
                let height = img.height;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    } else {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error("Canvas context error")); return; }
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl.split(',')[1]);
            };
            img.onerror = () => reject(new Error("Image load error"));
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getFilename(originalName: string, targetExt: string): string {
    if (targetExt === 'default') return originalName;
    return originalName.replace(/\.[^/.]+$/, "") + "." + targetExt;
}

function escapeCsv(str: any): string {
    if (str === undefined || str === null) return '""';
    const s = str.toString();
    return `"${s.replace(/"/g, '""')}"`;
}

export function generateCsv(items: FileItem[], platform: Platform, extensionMode: string): string {
    const completed = items.filter(i => i.status === 'complete' && i.metadata);
    
    let headers: string[] = [];
    let rows: string[][] = [];

    const cleanItems = completed.map(item => {
        const m = item.metadata!;
        
        let keywordArray: string[] = [];
        const rawKeywords = m.keywords as any;
        if (Array.isArray(rawKeywords)) {
            keywordArray = rawKeywords;
        } else if (typeof rawKeywords === 'string' && rawKeywords.trim() !== '') {
            keywordArray = rawKeywords.split(',').map((k: string) => k.trim());
        }

        return {
            ...item,
            metadata: {
                ...m,
                title: cleanText(m.title),
                description: cleanText(m.description),
                keywords: keywordArray.map(k => cleanText(k)),
                category: m.category,
                adobe_category: m.adobe_category,
                shutterstock_main: m.shutterstock_main,
                shutterstock_optional: m.shutterstock_optional,
                vectorstock_primary: m.vectorstock_primary,
                vectorstock_secondary: m.vectorstock_secondary,
            }
        };
    });

    if (platform === 'Adobe Stock') {
        headers = ['Filename', 'Title', 'Keywords', 'Category'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            return [
                getFilename(item.file.name, extensionMode),
                m.title,
                (m.keywords || []).join(', '),
                m.adobe_category || m.category || ''
            ];
        });
    } else if (platform === 'Shutterstock') {
        headers = ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Mature content', 'illustration'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            const categories = [m.shutterstock_main, m.shutterstock_optional].filter(Boolean).join(', ');
            return [
                getFilename(item.file.name, extensionMode),
                m.description,
                (m.keywords || []).join(', '),
                categories,
                'no', 'no', 'yes'
            ];
        });
    } else if (platform === 'Vecteezy') {
        headers = ['Filename', 'Title', 'Keywords'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            return [
                getFilename(item.file.name, extensionMode),
                m.title,
                (m.keywords || []).join(', ')
            ];
        });
    } else if (platform === 'VectorStock') {
        headers = ['Filename', 'Title', 'Description', 'Keywords', 'Primary Category', 'Secondary Category'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            return [
                getFilename(item.file.name, extensionMode),
                m.title,
                m.description,
                (m.keywords || []).join(', '),
                m.vectorstock_primary || '',
                m.vectorstock_secondary || ''
            ];
        });
    } else {
        headers = [
            'File Name', 'Title', 'Description', 'Keywords', 
            'Adobe Stock Category', 'Shutterstock Main Category',
            'Shutterstock Optional Category', 'VectorStock Primary Category',
            'VectorStock Secondary Category'
        ];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            return [
                getFilename(item.file.name, extensionMode),
                m.title,
                m.description,
                (m.keywords || []).join(', '),
                m.adobe_category || m.category || '',
                m.shutterstock_main || '',
                m.shutterstock_optional || '',
                m.vectorstock_primary || '',
                m.vectorstock_secondary || ''
            ];
        });
    }

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => escapeCsv(cell)).join(','))
    ].join('\n');

    return csvContent;
}

export function generateReport(items: FileItem[], platform: Platform, titleLenTarget: number, descLenTarget: number, kwCountTarget: number): string {
    const completed = items.filter(i => i.status === 'complete' && i.metadata);
    if (completed.length === 0) return "";
    
    let reportContent = "METADATA GENERATION REPORT\n";
    reportContent += "=================================================\n\n";

    completed.forEach((item, index) => {
        const m = item.metadata!;
        const titleStr = cleanText(m.title);
        const descStr = cleanText(m.description);
        const titleCount = titleStr.trim().split(/\s+/).filter(Boolean).length;
        const descCount = descStr.trim().split(/\s+/).filter(Boolean).length;
        const kwCount = Array.isArray(m.keywords) ? m.keywords.length : 0;

        const getLengthExplanation = (actual: number, target: number, type: string) => {
            if (actual === target) return `The ${type} matches your target length exactly for the best balance.`;
            if (actual < target) return `We used slightly fewer words for the ${type} to keep the message clear and avoid repeating unnecessary information.`;
            return `We used a few extra words in the ${type} to make sure we described every important part of your image correctly for better search results.`;
        };

        reportContent += `FILE ${index + 1}: ${item.file.name}\n`;
        reportContent += `-------------------------------------------------\n`;
        reportContent += `1. TITLE DETAILS\n`;
        reportContent += `   Actual length: ${titleCount} words (Your goal: ${titleLenTarget})\n`;
        reportContent += `   Explanation: ${getLengthExplanation(titleCount, titleLenTarget, 'title')}\n`;
        reportContent += `   Logic: The title was written by finding the main subject and its action, using the most descriptive words first to grab attention.\n`;
        reportContent += `   Content: ${titleStr}\n\n`;
        reportContent += `2. DESCRIPTION DETAILS\n`;
        reportContent += `   Actual length: ${descCount} words (Your goal: ${descLenTarget})\n`;
        reportContent += `   Explanation: ${getLengthExplanation(descCount, descLenTarget, 'description')}\n`;
        reportContent += `   Logic: The description explains the whole scene simply, focusing on the setting and visual mood so people can find your work easily.\n`;
        reportContent += `   Content: ${descStr}\n\n`;
        reportContent += `3. KEYWORD DETAILS\n`;
        reportContent += `   Actual count: ${kwCount} keywords (Your goal: ${kwCountTarget})\n`;
        reportContent += `   Explanation: ${getLengthExplanation(kwCount, kwCountTarget, 'keyword count')}\n`;
        reportContent += `   Logic: Keywords were chosen by identifying every object, color, and concept in the image, keeping only the most relevant search terms.\n`;
        reportContent += `   Content: ${m.keywords.map(k => cleanText(k)).join(', ')}\n\n`;
        reportContent += `-------------------------------------------------\n\n`;
    });

    reportContent += "GLOBAL SUMMARY & STRATEGY\n";
    reportContent += "=================================================\n";
    reportContent += "Overall Strategy: Our goal is to create metadata that is both honest and powerful. We focus on clear headlines and relevant keywords that help your work stand out on stock platforms.\n\n";
    reportContent += "Why these keywords were selected:\n";
    reportContent += "These keywords were picked because they describe exactly what is in your images and how they feel. We prioritize words that real buyers actually type into search bars.\n\n";
    reportContent += "Recommendations:\n";
    reportContent += "- Do a quick check of the metadata to ensure it fits your specific style.\n";
    reportContent += "- Use these results to learn which types of words help your images get found more often.\n";
    reportContent += "- Ensure that the categories selected match the specific rules of your stock platform.\n\n";
    reportContent += "=================================================\n";

    return reportContent;
}