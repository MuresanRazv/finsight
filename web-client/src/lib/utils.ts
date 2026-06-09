import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function cleanArticleTitle(
    title: string,
    sourceName?: string | null,
    url?: string,
): string {
    if (!title) return ''
    let cleaned = title.trim()

    // 1. Generic cleaning for common patterns based on the source name / url domain
    const searchTerms: string[] = []
    if (sourceName) {
        searchTerms.push(sourceName.toLowerCase())
        searchTerms.push(sourceName.toLowerCase().replace(/\s+/g, ''))
    }
    if (url) {
        try {
            const hostname = new URL(url).hostname.replace('www.', '')
            searchTerms.push(hostname.toLowerCase())
            const domainOnly = hostname.split('.')[0]
            if (domainOnly) {
                searchTerms.push(domainOnly.toLowerCase())
            }
        } catch (e) {}
    }

    // Filter out very short search terms to avoid over-matching
    const uniqueTerms = Array.from(
        new Set(searchTerms.filter((t) => t.length > 2)),
    )

    for (const term of uniqueTerms) {
        const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(
            `\\s*[|–\\-\\—•]\\s*(?:the\\s+)?${escaped}\\b.*$`,
            'i',
        )
        cleaned = cleaned.replace(regex, '')
    }

    // 2. Fallback static regex for common known publishers just in case they differ slightly
    cleaned = cleaned.replace(
        /\s*[|–\-\—•]\s*(the\s+)?(verge|business\s+insider|reuters|cnbc|bloomberg|nytimes|wsj|techcrunch|marketwatch|yahoo\s+finance|benzinga|ft|financial\s+times)\b.*$/gi,
        '',
    )

    return cleaned.trim()
}
