import { getElementLabel } from '@lib/bricks';

/**
 * Processes SVG elements for Bricks conversion
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object} The processed element
 */
export const processSvgElement = (node, element, tag = 'svg', context = {}) => {
  element.name = 'svg';
  element.label = getElementLabel(node, 'SVG', context);
  element.settings.source = 'code';
  element.settings.code = node.outerHTML;
  // Bricks requires these metadata fields for code-based elements
  element.settings.signature = crypto.randomUUID().replace(/-/g, '').substring(0, 32);
  element.settings.user_id = 1;
  element.settings.time = Math.floor(Date.now() / 1000);

  return element;
};
