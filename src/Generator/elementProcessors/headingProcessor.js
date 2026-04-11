import { getElementLabel } from '@lib/bricks';

/**
 * Processes heading elements (h1-h6) for Bricks conversion
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name (h1-h6)
 * @param {Object} context - Optional context values (showNodeClass, activeTagIndex, etc.)
 * @returns {Object|null} The processed element or null if invalid
 */
export const processHeadingElement = (node, element, tag, context = {}) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return null;
  }

  element.name = 'heading';
  element.label = getElementLabel(node, `${tag.toUpperCase()} Heading`, context);
  element.settings.tag = tag;

  // If the heading contains child elements (SVG icons, <em>, <br>, <mark>, etc.)
  // use innerHTML to preserve the full markup in Bricks' rich heading field.
  // Pure text headings continue to use textContent (cleaner, avoids whitespace issues).
  if (node.children.length > 0) {
    element.settings.text = node.innerHTML.trim();
  } else {
    element.settings.text = node.textContent.trim();
  }

  // Headings with inline markup should not have their children re-processed
  // as separate Bricks elements — the innerHTML already captures everything.
  if (node.children.length > 0) {
    element._skipChildren = true;
  }

  return element;
};
