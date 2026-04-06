/**
 * HTML Input Processor
 * Handles stripping of HTML structural tags and extraction of style/script tags
 */

/**
 * Result object from processing HTML input
 * @typedef {Object} ProcessedHtmlResult
 * @property {string} bodyContent - Cleaned body content
 * @property {string} extractedCss - CSS extracted from <style> tags
 * @property {string} extractedJs - JS extracted from <script> tags
 */

/**
 * Strip HTML structural tags and extract style/script content
 * 
 * @param {string} html - Raw HTML input
 * @param {Object} options - Processing options
 * @param {boolean} options.extractStyles - Extract CSS from <style> tags (default: true)
 * @param {boolean} options.extractScripts - Extract JS from <script> tags (default: true)
 * @param {boolean} options.stripHead - Remove <head> section entirely (default: true)
 * @param {boolean} options.stripHtmlBodyTags - Strip <html>, <head>, <body> wrapper tags (default: true)
 * @returns {ProcessedHtmlResult} Processed HTML result
 */
export function processHtmlInput(html, options = {}) {
  const {
    extractStyles = true,
    extractScripts = true,
    stripHead = true,
    stripHtmlBodyTags = true,
  } = options;

  if (!html || typeof html !== 'string') {
    return {
      bodyContent: html || '',
      extractedCss: '',
      extractedJs: '',
    };
  }

  let processedHtml = html.trim();
  let extractedCss = '';
  let extractedJs = '';

  try {
    // Extract <style> tags content if enabled
    if (extractStyles) {
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let match;
      
      while ((match = styleRegex.exec(processedHtml)) !== null) {
        const cssContent = match[1].trim();
        if (cssContent) {
          extractedCss += (extractedCss ? '\n\n' : '') + cssContent;
        }
      }
      
      // Remove all <style> tags from HTML
      processedHtml = processedHtml.replace(styleRegex, '');
    }

    // Extract <script> tags content if enabled
    if (extractScripts) {
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      
      while ((match = scriptRegex.exec(processedHtml)) !== null) {
        const jsContent = match[1].trim();
        // Only extract if it doesn't have a src attribute (inline scripts only)
        const tag = match[0];
        if (!tag.includes('src=')) {
          if (jsContent) {
            extractedJs += (extractedJs ? '\n\n' : '') + jsContent;
          }
        }
      }
      
      // Remove all <script> tags from HTML
      processedHtml = processedHtml.replace(scriptRegex, '');
    }

    // Remove <!DOCTYPE> declaration
    processedHtml = processedHtml.replace(/<!DOCTYPE[^>]*>/gi, '');

    // Strip <html>, <head>, <body> wrapper tags if enabled
    if (stripHtmlBodyTags) {
      // Remove <html> and </html> tags
      processedHtml = processedHtml.replace(/<html[^>]*>/gi, '');
      processedHtml = processedHtml.replace(/<\/html>/gi, '');

      // Remove entire <head> section if enabled
      if (stripHead) {
        processedHtml = processedHtml.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
      } else {
        // Just strip <head> tags but keep content
        processedHtml = processedHtml.replace(/<head[^>]*>/gi, '');
        processedHtml = processedHtml.replace(/<\/head>/gi, '');
      }

      // Remove <body> and </body> tags
      processedHtml = processedHtml.replace(/<body[^>]*>/gi, '');
      processedHtml = processedHtml.replace(/<\/body>/gi, '');
    }

    // Clean up excessive whitespace
    processedHtml = processedHtml
      .replace(/^\s*\n/gm, '') // Remove empty lines at start
      .trim();

  } catch (error) {
    console.error('Error processing HTML input:', error);
    // Return original HTML if processing fails
    return {
      bodyContent: html,
      extractedCss: '',
      extractedJs: '',
    };
  }

  return {
    bodyContent: processedHtml,
    extractedCss,
    extractedJs,
  };
}

/**
 * Quick wrapper function for simple usage - just strip and extract
 * 
 * @param {string} html - Raw HTML input
 * @returns {ProcessedHtmlResult} Processed HTML result
 */
export function stripAndExtract(html) {
  return processHtmlInput(html, {
    extractStyles: true,
    extractScripts: true,
    stripHead: true,
    stripHtmlBodyTags: true,
  });
}
