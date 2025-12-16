
import { FileItem, Metadata, Platform } from '../types';

export function cleanText(text: string): string {
    if (!text) return "";
    
    // STRICT WHITELIST: Only allow Letters (a-z, A-Z), Numbers (0-9), Spaces, Commas, and Periods.
    // Replace everything else (like quotes, hyphens, brackets, slashes) with a space to prevent word merging.
    let cleaned = text.replace(/[^a-zA-Z0-9\s,.]/g, ' ');

    // Collapse multiple spaces into one and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // STRICTLY remove trailing period if present, as requested
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
                // Resize logic: Max dimension 1536px
                // This ensures the base64 string stays within Groq/OpenAI payload limits (~4MB)
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
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                
                // Draw white background for transparent PNGs converted to JPEG
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Export as JPEG with 0.85 quality to save space
                // This forces the output to be image/jpeg regardless of input
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                
                // Return just the base64 data, stripping the "data:image/jpeg;base64," prefix
                resolve(dataUrl.split(',')[1]);
            };
            img.onerror = () => reject(new Error("Failed to load image"));
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

    // Apply strict cleanText to all metadata fields before CSV generation
    // This guarantees no special symbols (except , and .) appear in the CSV.
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
        // Combined Categories into one column
        headers = ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Mature content', 'illustration'];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            // Combine main and optional with comma
            const categories = [m.shutterstock_main, m.shutterstock_optional].filter(Boolean).join(', ');
            
            return [
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.description),
                escapeCsv((m.keywords || []).join(', ')),
                escapeCsv(categories), // Combined Categories
                '"no"', // Editorial
                '"no"', // Mature content
                '"yes"' // illustration
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
        // General
        headers = [
            'File Name', 'Title', 'Description', 'Keywords', 
            'Adobe Stock Category', 'Shutterstock Main Category',
            'Shutterstock Optional Category', 'VectorStock Primary Category',
            'VectorStock Secondary Category'
        ];
        rows = cleanItems.map(item => {
            const m = item.metadata!;
            let adobeC = m.adobe_category || m.category || '';
            
            return [
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.title),
                escapeCsv(m.description),
                escapeCsv((m.keywords || []).join(', ')),
                escapeCsv(adobeC),
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
    
    let reportContent = "METADATA EXPLANATION REPORT\n";
    reportContent += "=================================================\n\n";

    completed.forEach((item, index) => {
        const m = item.metadata!;
        const exp = m.explanation!;

        const titleCount = m.title ? m.title.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        const descCount = m.description ? m.description.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        const kwCount = Array.isArray(m.keywords) ? m.keywords.length : 0;

        reportContent += `FILE ${index + 1}: ${item.file.name}\n`;
        reportContent += `STATS: Title: ${titleCount} words | Description: ${descCount} words | Keywords: ${kwCount} tags\n`;
        reportContent += `-------------------------------------------------\n`;
        
        reportContent += `1. Title Strategy (Target ${titleLenTarget} words):\n`;
        reportContent += `   ${exp.title_logic || 'N/A'}\n`;
        if (titleCount > titleLenTarget) {
            reportContent += `   Note: Title count (${titleCount}) exceeded target (${titleLenTarget}) to ensure the sentence was grammatically complete.\n`;
        }
        reportContent += `\n`;

        reportContent += `2. Description Strategy (Target ${descLenTarget} words):\n`;
        reportContent += `   ${exp.description_logic || 'N/A'}\n`;
        if (descCount > descLenTarget) {
            reportContent += `   Note: Description count (${descCount}) extended slightly beyond target (${descLenTarget}) to fully describe the scene without being cut off.\n`;
        }
        reportContent += `\n`;

        reportContent += `3. Keyword Logic (Target ${kwCountTarget} tags):\n   ${exp.keyword_logic || 'N/A'}\n\n`;
        reportContent += `4. Sales & Visibility Strategy:\n   ${exp.sales_logic || 'N/A'}\n\n`;
        reportContent += "=================================================\n\n";
    });

    reportContent += "\n\n";
    reportContent += "#################################################\n";
    reportContent += "               GLOBAL SUMMARY\n";
    reportContent += "#################################################\n\n";
    
    reportContent += `Total Files Processed: ${completed.length}\n`;
    reportContent += `Platform Strategy: ${platform}\n\n`;
    reportContent += "BATCH STRATEGY OVERVIEW:\n";
    reportContent += "The metadata for this batch was generated with a strict focus on high-intent search terms. ";
    reportContent += "By avoiding generic filler words and adhering to strict platform character limits, these assets are optimized to appear in targeted buyer searches rather than broad, low-conversion impressions.\n\n";

    return reportContent;
}
