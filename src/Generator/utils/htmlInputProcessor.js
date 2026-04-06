/**
 * HTML Input Processor
 * Handles stripping of HTML structural tags, extraction of style/script tags,
 * and auto-correction of common HTML/CSS errors
 */

/**
 * Auto-correct common CSS errors
 * 
 * @param {string} css - CSS content
 * @returns {string} Corrected CSS content
 */
function autoCorrectCSS(css) {
  if (!css || typeof css !== 'string') return css;

  let corrected = css;

  try {
    // Fix missing closing braces for rules
    // Count opening and closing braces
    const openBraces = (corrected.match(/{/g) || []).length;
    const closeBraces = (corrected.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      const missingBraces = openBraces - closeBraces;
      // Add missing closing braces at the end
      corrected += '\n' + '}'.repeat(missingBraces);
    }

    // Fix missing semicolons before closing braces (common error)
    corrected = corrected.replace(/([^;\s])\s*\n\s*}/g, '$1;\n}');

    // Fix common indentation issues
    corrected = corrected.replace(/^\t+/gm, (match) => '  '.repeat(match.length));

    return corrected.trim();
  } catch (error) {
    console.error('Error auto-correcting CSS:', error);
    return css;
  }
}

/**
 * Auto-correct common HTML errors
 * 
 * @param {string} html - HTML content
 * @returns {string} Corrected HTML content
 */
function autoCorrectHTML(html) {
  if (!html || typeof html !== 'string') return html;

  let corrected = html;

  try {
    // Fix closing tags missing the final >
    // Pattern: </tagname without > at the end (before whitespace or newline)
    corrected = corrected.replace(/<\/\s*(\w+)\s*$/gm, '</$1>');
    
    // Fix opening tags with newlines in the middle that should have >
    // Match: <tagname attrs\n where attrs doesn't contain >
    corrected = corrected.replace(/<(\w+)([^>\n]*?)\s*\n/g, (match, tagName, attrs) => {
      // Only add > if attrs doesn't already end with >
      if (!attrs.trim().endsWith('>')) {
        return `<${tagName}${attrs}>\n`;
      }
      return match;
    });

    return corrected.trim();
  } catch (error) {
    console.error('Error auto-correcting HTML:', error);
    return html;
  }
}

/**
 * Result object from processing HTML input
 * @typedef {Object} ProcessedHtmlResult
 * @property {string} bodyContent - Cleaned body content
 * @property {string} extractedCss - CSS extracted from <style> tags
 * @property {string} extractedJs - JS extracted from <script> tags
 * @property {string[]} warnings - List of auto-corrections made
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
 * @param {boolean} options.autoCorrect - Auto-correct common errors (default: true)
 * @returns {ProcessedHtmlResult} Processed HTML result with any warnings
 */
export function processHtmlInput(html, options = {}) {
  const {
    extractStyles = true,
    extractScripts = true,
    stripHead = true,
    stripHtmlBodyTags = true,
    autoCorrect = true,
  } = options;

  if (!html || typeof html !== 'string') {
    return {
      bodyContent: html || '',
      extractedCss: '',
      extractedJs: '',
      warnings: [],
    };
  }

  let processedHtml = html.trim();
  let extractedCss = '';
  let extractedJs = '';
  const warnings = [];

  try {
    // Auto-correct HTML errors if enabled
    if (autoCorrect) {
      const originalHtml = processedHtml;
      processedHtml = autoCorrectHTML(processedHtml);
      
      // Detect if corrections were made
      if (processedHtml !== originalHtml) {
        warnings.push('Auto-corrected HTML errors (e.g., unclosed tags, malformed syntax)');
      }
    }

    // Extract <style> tags content if enabled
    if (extractStyles) {
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let match;
      
      while ((match = styleRegex.exec(processedHtml)) !== null) {
        let cssContent = match[1].trim();
        
        // Auto-correct CSS errors if enabled
        if (autoCorrect) {
          const originalCss = cssContent;
          cssContent = autoCorrectCSS(cssContent);
          
          if (cssContent !== originalCss) {
            warnings.push('Auto-corrected CSS errors (e.g., missing closing braces, missing semicolons)');
          }
        }
        
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
      warnings: [`Error during processing: ${error.message}`],
    };
  }

  return {
    bodyContent: processedHtml,
    extractedCss,
    extractedJs,
    warnings,
  };
}

/**
 * Quick wrapper function for simple usage - just strip and extract
 * 
 * @param {string} html - Raw HTML input
 * @returns {ProcessedHtmlResult} Processed HTML result with warnings
 */
export function stripAndExtract(html) {
  return processHtmlInput(html, {
    extractStyles: true,
    extractScripts: true,
    stripHead: true,
    stripHtmlBodyTags: true,
    autoCorrect: true,
  });
}
