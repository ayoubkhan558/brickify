import { getElementLabel } from '@lib/bricks';

/**
 * Processes list elements (ul, ol, li) for Bricks conversion
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object} The processed element
 */
export const processListElement = (node, element, tag, context = {}) => {
  // Check if list contains only simple text (no HTML tags except nested lists)
  const isSimpleList = Array.from(node.children).every(li => {
    if (li.tagName.toLowerCase() !== 'li') return false;

    // Check for nested lists
    const nestedLists = li.getElementsByTagName('ul').length + li.getElementsByTagName('ol').length;

    // Compare HTML vs text content, ignoring nested lists
    const liContent = li.innerHTML;
    const textContent = li.textContent.trim();

    // Allow nested lists in simple lists
    if (nestedLists > 0) {
      const withoutNested = liContent.replace(/<\/?(ul|ol)[^>]*>/g, '');
      return withoutNested.replace(/<[^>]+>/g, '') === textContent;
    }

    return liContent === textContent;
  });

  if (['ul', 'ol'].includes(tag)) {
    if (isSimpleList) {
      // Simple lists without formatting tags - use text-basic
      element.name = 'text-basic';
      element.label = getElementLabel(node, tag.toUpperCase() + ' List', context);
      element.settings.tag = tag;
      element.settings.text = node.innerHTML;
      element.settings.isRichText = true;
      element._skipChildren = true;
      // Don't return here - let the main function handle the return
    } else {
      // Complex lists - use div structure
      // element.name = tag === 'ul' ? 'ul' : 'ol';
      element.name = 'div';
      element.label = getElementLabel(node, tag.toUpperCase() + ' List', context);
      element.settings.tag = tag;
      element.settings.items = [];
    }
    element.label = tag === 'ul' ? 'Unordered List' : 'Ordered List';
  } else if (tag === 'li') {
    // List items - create div with tag setting
    element.name = 'div';
    element.settings.tag = tag;
    element.label = 'List Item';
  }

  return element;
};