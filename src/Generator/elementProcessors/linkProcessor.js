import { getElementLabel } from '@lib/bricks';
import { getLinkSettings } from '@generator/elementProcessors/linkUtils';

/**
 * Processes link elements (a) for Bricks conversion
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object} The processed element
 */
export const processLinkElement = (node, element, context = {}) => {
  const hasElementChildren = Array.from(node.children).length > 0;

  if (hasElementChildren) {
    element.name = 'div';
    element.settings.tag = 'a';
    element.label = getElementLabel(node, 'Link Block', context);

    if (node.hasAttribute('href')) {
      element.settings.link = getLinkSettings(node);
    }
  } else {
    element.name = 'text-link';
    element.label = getElementLabel(node, 'Link', context);

    if (node.hasAttribute('href')) {
      element.settings.link = getLinkSettings(node);
    }

    const textContent = node.textContent.trim();
    if (textContent) {
      element.settings.text = textContent;
      element.settings.tag = 'a';
    } else {
      element.settings.text = 'Link';
      element.settings.tag = 'a';
    }

    element._skipTextNodes = true;
  }

  return element;
};
