import DOMPurify from 'isomorphic-dompurify'

/**
 * Safe HTML wrapper — the only approved path for rendering user-controlled or
 * external HTML (e.g., TMDB overview text that may contain <i> tags).
 * Never use dangerouslySetInnerHTML without going through this function.
 */
export const safeHtml = (raw: string): string =>
  DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['i', 'em', 'b', 'strong', 'br'],
    ALLOWED_ATTR: [],
  })

/** Strip all HTML — for use in contexts where no markup is wanted. */
export const plainText = (raw: string): string =>
  DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
