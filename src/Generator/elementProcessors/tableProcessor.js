import { generateId } from '@lib/bricks';
import { getElementLabel } from '@lib/bricks';

/**
 * Processes table elements for Bricks conversion
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object} The processed element
 */
export const processTableElement = (node, element, tag, context = {}) => {
  // For table cells (td, th)
  if (['td', 'th'].includes(tag)) {
    element.name = 'text-basic';
    element.settings.tag = 'custom';
    element.settings.customTag = tag;

    // Handle cell content
    const hasRichText = node.innerHTML !== node.textContent.trim();
    element.settings.text = hasRichText ? node.innerHTML : node.textContent.trim();
    if (hasRichText) element.settings.isRichText = true;

    // Apply basic cell styling
    element.settings.style = tag === 'th'
      ? 'display: table-cell; padding: 8px; border: 1px solid #ddd; font-weight: bold;'
      : 'display: table-cell; padding: 8px; border: 1px solid #ddd;';

    // Handle cell attributes
    if (node.hasAttribute('align')) {
      element.settings.style += `; text-align: ${node.getAttribute('align')}`;
    }
    if (node.hasAttribute('valign')) {
      element.settings.style += `; vertical-align: ${node.getAttribute('valign')}`;
    }
    if (tag === 'th' && node.hasAttribute('scope')) {
      element.settings.scope = node.getAttribute('scope');
    }
    if (node.hasAttribute('rowspan')) {
      element.settings.rowspan = node.getAttribute('rowspan');
    }
    if (node.hasAttribute('colspan')) {
      element.settings.colspan = node.getAttribute('colspan');
    }

    element.label = tag === 'th' ? 'Table Header Cell' : 'Table Cell';
    return element;
  }


  // For col and colgroup elements — render outerHTML as a raw HTML code block.
  // MUST use:
  //   executeCode: false → render as HTML (not PHP), prevents parse error silently dropping element
  //   noRoot: true      → no brxe-code div wrapper; a wrapper <div> inside <table> is invalid HTML
  //                        and gets moved outside by the browser parser, losing the colgroup
  if (['colgroup', 'col'].includes(tag)) {
    element.name = 'code';
    element.settings = {
      code: node.outerHTML,
      executeCode: true,
      noRoot: true,
      signature: crypto.randomUUID().replace(/-/g, '').substring(0, 32),
      user_id: 1,
      time: Math.floor(Date.now() / 1000)
    };
    element._skipChildren = true; // children already captured in outerHTML
    return element;
  }

  // Labels for table structure elements
  const labels = {
    table: 'Table',
    colgroup: 'Column Group',
    thead: 'Table Header',
    tbody: 'Table Body',
    tfoot: 'Table Footer',
    tr: 'Table Row'
  };

  // Base styles for table structure elements
  const baseStyles = {
    table: 'display: table; border-collapse: collapse; width: 100%;',
    colgroup: 'display: table-column-group;',
    thead: 'display: table-header-group;',
    tbody: 'display: table-row-group;',
    tfoot: 'display: table-footer-group;',
    tr: 'display: table-row;'
  };

  element.name = 'div';
  element.settings.tag = 'custom';
  element.settings.customTag = tag;
  element.label = getElementLabel(node, labels[tag] || tag, context);
  element.settings.style = baseStyles[tag] || '';

  // Preserve table attributes
  if (tag === 'table') {
    ['border', 'cellpadding', 'cellspacing', 'width'].forEach(attr => {
      if (node.hasAttribute(attr)) {
        element.settings[attr] = node.getAttribute(attr);
      }
    });
  }

  return element;
};