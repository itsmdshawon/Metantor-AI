
import { FileItem, Metadata, Platform } from '../types';

export function cleanText(text: string): string {
    if (!text) return "";
    
    // Whitelist common characters. 
    // We allow letters, numbers, spaces, commas, and dots.
    let cleaned = text.replace(/[^a-zA-Z0-9\s,.]/g, ' ');

    // Normalize spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove trailing period ONLY if it's at the absolute end,
    // as "Vector illustration" should not have a trailing dot.
    if (cleaned.endsWith('.')) {
        cleaned = cleaned.slice(0, -1);
    }

    return cleaned;
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const MAX_SIZE = 1536;
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
                if (!ctx) {
                    reject(new Error("Canvas context error"));
                    return;
                }
                
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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

function escapeCsv(str: string | undefined): string {
    return `"${(str || '').toString().replace(/"/g, '""')}"`;
}

export function generateCsv(items: FileItem[], platform: Platform, extensionMode: string): string {
    let headers: string[] = [];
    let rows: string[] = [];
    const completed = items.filter(i => i.status === 'complete' && i.metadata);

    const cleanItems = completed.map(item => {
        const m = item.metadata!;
        return {
            ...item,
            metadata: {
                ...m,
                title: cleanText(m.title),
                description: cleanText(m.description),
                keywords: (m.keywords || []).map(k => cleanText(k))
            }
        };
    });

    if (platform === 'Adobe Stock') {
        headers = ['Filename', 'Title', 'Keywords', 'Category'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            return [
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.title),
                escapeCsv((m.keywords || []).join(', ')),
                escapeCsv(m.category || m.adobe_category)
            ].join(',');
        });
    } else if (platform === 'Shutterstock') {
        headers = ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Mature content', 'illustration'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            const categories = [m.shutterstock_main, m.shutterstock_optional].filter(Boolean).join(', ');
            return [
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.description),
                escapeCsv((m.keywords || []).join(', ')),
                escapeCsv(categories),
                '"no"', '"no"', '"yes"'
            ].join(',');
        });
    } else if (platform === 'Vecteezy') {
        headers = ['Filename', 'Title', 'Keywords'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            return [
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.title),
                escapeCsv((m.keywords || []).join(', '))
            ].join(',');
        });
    } else if (platform === 'VectorStock') {
        headers = ['Filename', 'Title', 'Description', 'Keywords', 'Primary Category', 'Secondary Category'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            return [
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.title),
                escapeCsv(m.description),
                escapeCsv((m.keywords || []).join(', ')),
                escapeCsv(m.vectorstock_primary),
                escapeCsv(m.vectorstock_secondary)
            ].join(',');
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
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.title),
                escapeCsv(m.description),
                escapeCsv((m.keywords || []).join(', ')),
                escapeCsv(m.adobe_category || m.category || ''),
                escapeCsv(m.shutterstock_main),
                escapeCsv(m.shutterstock_optional),
                escapeCsv(m.vectorstock_primary),
                escapeCsv(m.vectorstock_secondary)
            ].join(',');
        });
    }

    return [headers.join(','), ...rows].join('\n');
}

export function generateReport(items: FileItem[], platform: Platform, titleLenTarget: number, descLenTarget: number, kwCountTarget: number): string {
    const completed = items.filter(i => i.status === 'complete' && i.metadata && i.metadata.explanation);
    
    let reportContent = "=================================================\n";
    reportContent += "METADATA GENERATION REPORT SUMMARY\n";
    reportContent += `Platform: ${platform}\n`;
    reportContent += `Files Processed: ${completed.length}\n`;
    reportContent += "=================================================\n\n";

    completed.forEach((item, index) => {
        const m = item.metadata!;
        const exp = m.explanation!;
        
        const titleCount = m.title ? m.title.trim().split(/\s+/).length : 0;
        const descCount = m.description ? m.description.trim().split(/\s+/).length : 0;
        const kwCount = m.keywords ? m.keywords.length : 0;

        reportContent += `FILE ${index + 1}: ${item.file.name}\n`;
        reportContent += `STATS: Title: ${titleCount} words | Description: ${descCount} words | Keywords: ${kwCount} tags\n`;
        reportContent += `-------------------------------------------------\n\n`;
        
        // 1. Title Breakdown
        const titleDiff = titleCount - titleLenTarget;
        const titleStatus = titleDiff === 0 ? "Perfect" : (titleDiff > 0 ? `+${titleDiff} over` : `${titleDiff} under`);
        reportContent += `1. Title Breakdown (Target: ${titleLenTarget} words | Actual: ${titleCount} words, ${titleStatus}):\n`;
        reportContent += `   ${exp.title_logic || 'Explains how the title was built.'}\n\n`;

        // 2. Description Breakdown
        const descDiff = descCount - descLenTarget;
        const descStatus = descDiff === 0 ? "Perfect" : (descDiff > 0 ? `+${descDiff} over` : `${descDiff} under`);
        reportContent += `2. Description Breakdown (Target: ${descLenTarget} words | Actual: ${descCount} words, ${descStatus}):\n`;
        reportContent += `   ${exp.description_logic || 'Explains how the description was built.'}\n\n`;

        // 3. Why these Keywords? (Target)
        reportContent += `3. Why these Keywords? (Target: ${kwCountTarget} tags | Actual: ${kwCount} tags):\n`;
        reportContent += `   ${exp.keyword_logic || 'Explains the choice of keywords.'}\n\n`;

        // 4. Sales Strategy
        reportContent += `4. Sales Strategy:\n`;
        reportContent += `   ${exp.sales_logic || 'Explains why this helps sales.'}\n\n`;
        
        reportContent += `=================================================\n\n`;
    });

    return reportContent;
}
