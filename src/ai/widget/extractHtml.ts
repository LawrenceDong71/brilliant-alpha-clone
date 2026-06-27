/**
 * Models sometimes wrap generated HTML in Markdown code fences or add stray
 * prose despite instructions. This pulls out the actual HTML document so it can
 * be dropped into an iframe `srcdoc`. Pure + deterministic so it can be tested.
 */
export function extractHtml(raw: string): string {
  let s = raw.trim()

  // Strip a leading ```html / ``` fence and the trailing ``` if present.
  const fence = s.match(/^```(?:html)?\s*\n([\s\S]*?)\n?```$/i)
  if (fence) s = fence[1].trim()

  // If there's prose around a document, keep from the first doctype/<html>.
  const docStart = s.search(/<!doctype html>|<html[\s>]/i)
  if (docStart > 0) s = s.slice(docStart)

  return s.trim()
}

/** True when the string looks like a renderable HTML document. */
export function looksLikeHtmlDocument(s: string): boolean {
  return /<!doctype html>|<html[\s>]|<body[\s>]/i.test(s)
}
