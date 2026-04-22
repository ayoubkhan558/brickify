/**
 * HTML Input Processor
 * Strips structural tags (<html>, <head>, <body>) and their content,
 * extracts <style> content → CSS tab and <script> content → JS tab.
 * No auto-correction of HTML/CSS is performed.
 */

/**
 * Result object from processing HTML input
 * @typedef {Object} ProcessedHtmlResult
 * @property {string} bodyContent - Cleaned body content (no structural wrapper tags)
 * @property {string} extractedCss - CSS extracted from <style> tags
 * @property {string} extractedJs  - JS extracted from inline <script> tags
 */

/**
 * Strip HTML structural tags and extract style/script content.
 *
 * Steps performed (in order):
 *  1. Remove <!DOCTYPE …>
 *  2. Extract all inline <script> tag content → extractedJs, then remove the tags
 *  3. Extract all <style> tag content → extractedCss, then remove the tags
 *  4. Remove the entire <head>…</head> section (with whatever remains inside it)
 *  5. Strip the <html …> / </html> and <body …> / </body> wrapper tags
 *  6. Collapse leading blank lines
 *
 * @param {string} html - Raw HTML input
 * @returns {ProcessedHtmlResult}
 */
export function stripAndExtract(html) {
  if (!html || typeof html !== 'string') {
    return { bodyContent: html || '', extractedCss: '', extractedJs: '' };
  }

  let processed = html.trim();
  let extractedCss = '';
  let extractedJs = '';

  try {
    // 1. Remove <!DOCTYPE …>
    processed = processed.replace(/<!DOCTYPE[^>]*>/gi, '');

    // 2. Extract inline <script> content (no src attribute), then remove all <script> tags
    const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    processed = processed.replace(scriptRegex, (match, attrs, content) => {
      // Only grab inline scripts (no src="…")
      if (!/\bsrc\s*=/i.test(attrs)) {
        const js = content.trim();
        if (js) {
          extractedJs += (extractedJs ? '\n\n' : '') + js;
        }
      }
      return ''; // remove the tag from HTML either way
    });

    // 3. Extract <style> content, then remove all <style> tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    processed = processed.replace(styleRegex, (match, content) => {
      const css = content.trim();
      if (css) {
        extractedCss += (extractedCss ? '\n\n' : '') + css;
      }
      return ''; // remove the tag from HTML
    });

    // 4. Remove entire <head>…</head> section (anything left inside it, e.g. meta, title, link)
    processed = processed.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');

    // 5. Strip wrapper tags: <html>, </html>, <body …>, </body>
    processed = processed.replace(/<html[^>]*>/gi, '');
    processed = processed.replace(/<\/html>/gi, '');
    processed = processed.replace(/<body[^>]*>/gi, '');
    processed = processed.replace(/<\/body>/gi, '');

    // 6. Collapse multiple leading blank lines
    processed = processed.replace(/^\s*\n/gm, '').trim();

  } catch (error) {
    console.error('Error processing HTML input:', error);
    return { bodyContent: html, extractedCss: '', extractedJs: '' };
  }

  return { bodyContent: processed, extractedCss, extractedJs };
}

// Legacy alias kept for any other code that imports processHtmlInput directly
export function processHtmlInput(html) {
  return { ...stripAndExtract(html), warnings: [] };
}
