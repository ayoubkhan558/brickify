import { getElementLabel } from '@lib/bricks';

/**
 * Processes image elements for Bricks conversion
 * Handles only img-specific attributes defined in ELEMENT_SPECIFIC_ATTRIBUTES
 * Other attributes are handled by the general attribute processor
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object} The processed element
 */
export const processImageElement = (node, element, context = {}) => {
  element.name = 'image';
  element.label = getElementLabel(node, 'Image', context);

  const src = node.getAttribute('src') || '';
  const alt = node.getAttribute('alt') || '';

  // Basic image settings
  element.settings.src = src;
  element.settings.alt = alt;

  element.settings.image = {
    url: src,
    external: true,
    filename: (src || 'image.jpg').split('/').pop().split('?')[0] // Remove query params
  };

  // Handle width and height - these affect Bricks layout
  const width = node.getAttribute('width');
  const height = node.getAttribute('height');

  if (width) {
    element.settings._width = /^\d+$/.test(width) ? `${width}px` : width;
  }

  if (height) {
    element.settings._height = /^\d+$/.test(height) ? `${height}px` : height;
  }

  // Handle lazy loading - Bricks native feature
  const loading = node.getAttribute('loading');
  if (loading === 'lazy' || loading === 'eager') {
    element.settings.loading = loading;
  }

  // Handle responsive images - Bricks native features
  const srcset = node.getAttribute('srcset');
  if (srcset) {
    element.settings.srcset = srcset;
  }

  const sizes = node.getAttribute('sizes');
  if (sizes) {
    element.settings.sizes = sizes;
  }

  return element;
};

