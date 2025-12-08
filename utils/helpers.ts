
import { FileItem, Metadata, Platform } from '../types';

export function cleanText(text: string): string {
    if (!text) return "";
    // Aggressively remove all special characters except comma and space
    return text.replace(/[.\\/\[\]\{\}\?\-\+\*\_\#\@\!\~\%\$\^\&\(\)\:\;\"\'\`]/g, '').trim();
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
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

    if (platform === 'Adobe Stock') {
        headers = ['Filename', 'Title', 'Keywords', 'Category'];
        rows = completed.map(item => {
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
        rows = completed.map(item => {
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
        rows = completed.map(item => {
            const m = item.metadata!;
            return [
                escapeCsv(getFilename(item.file.name, extensionMode)),
                escapeCsv(m.title),
                escapeCsv((m.keywords || []).join(', '))
            ].join(',');
        });
    } else if (platform === 'VectorStock') {
        headers = ['Filename', 'Title', 'Description', 'Keywords', 'Primary Category', 'Secondary Category'];
        rows = completed.map(item => {
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
        rows = completed.map(item => {
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
