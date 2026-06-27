import { describe, expect, it } from 'vitest'
import { extractHtml, looksLikeHtmlDocument } from './extractHtml'

describe('extractHtml', () => {
  it('returns a clean document unchanged', () => {
    const doc = '<!doctype html><html><body>hi</body></html>'
    expect(extractHtml(doc)).toBe(doc)
  })

  it('strips ```html code fences', () => {
    const raw = '```html\n<!doctype html><html><body>x</body></html>\n```'
    expect(extractHtml(raw)).toBe('<!doctype html><html><body>x</body></html>')
  })

  it('strips a bare ``` fence', () => {
    const raw = '```\n<html><body>y</body></html>\n```'
    expect(extractHtml(raw)).toBe('<html><body>y</body></html>')
  })

  it('drops leading prose before the document', () => {
    const raw = 'Sure! Here is your widget:\n\n<!doctype html><html></html>'
    expect(extractHtml(raw)).toBe('<!doctype html><html></html>')
  })

  it('trims surrounding whitespace', () => {
    expect(extractHtml('   <html></html>   ')).toBe('<html></html>')
  })
})

describe('looksLikeHtmlDocument', () => {
  it('accepts real documents', () => {
    expect(looksLikeHtmlDocument('<!doctype html><html></html>')).toBe(true)
    expect(looksLikeHtmlDocument('<body>hi</body>')).toBe(true)
  })

  it('rejects non-documents', () => {
    expect(looksLikeHtmlDocument('sorry, I cannot help with that')).toBe(false)
    expect(looksLikeHtmlDocument('{"error":"x"}')).toBe(false)
  })
})
