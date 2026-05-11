const ALLOWED: Set<string> = new Set(['i', 'em', 'b', 'strong', 'br'])

function stripTags(raw: string, allowed: Set<string> = new Set()): string {
  return raw
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*/gi, (match, tag: string) =>
      allowed.has(tag.toLowerCase()) ? match : ''
    )
    .replace(/>/g, (ch) => (allowed.size > 0 ? ch : ''))
}

/**
 * Safe HTML — only approved path for dangerouslySetInnerHTML.
 * Allows a small inline formatting allowlist; strips everything else.
 */
export const safeHtml = (raw: string): string => stripTags(raw, ALLOWED)

/** Strip all HTML — use for text nodes where no markup is needed. */
export const plainText = (raw: string): string => stripTags(raw)
