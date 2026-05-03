import { getElementLabel } from '@lib/bricks';

/**
 * Processes audio elements for Bricks conversion
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object} The processed element
 */
export const processAudioElement = (node, element, context = {}) => {
  const audioSrc = node.querySelector('source')?.getAttribute('src') || node.getAttribute('src') || '';

  element.name = 'audio';
  element.label = getElementLabel(node, 'Audio', context);
  element.settings.source = 'external';
  element.settings.external = audioSrc;
  element.settings.loop = node.hasAttribute('loop');
  element.settings.autoplay = node.hasAttribute('autoplay');

  return element;
};
