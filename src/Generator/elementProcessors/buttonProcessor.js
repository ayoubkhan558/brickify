import { getElementLabel } from '@lib/bricks';

/**
 * Processes button elements for Bricks conversion
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object} The processed element
 */
export const processButtonElement = (node, element, tag = 'button', context = {}) => {
  const textContent = node.textContent.trim();
  const hasSvg = node.querySelector('svg') !== null;

  // Icon-only buttons (SVG with no visible text): render as a raw HTML code element
  // so the SVG renders correctly in Bricks. A Bricks 'button' element's text field
  // can't embed SVG markup, so we fall back to a code block for these.
  if (hasSvg && !textContent) {
    element.name = 'code';
    element.label = getElementLabel(node, 'Icon Button', context);
    element.settings = {
      code: node.outerHTML,
      executeCode: true, // PHP engine echoes raw HTML literals — renders correctly in page
      signature: crypto.randomUUID().replace(/-/g, '').substring(0, 32),
      user_id: 1,
      time: Math.floor(Date.now() / 1000)
    };
    element._skipChildren = true;
    return element;
  }

  element.name = 'button';
  element.label = getElementLabel(node, 'Button', context);

  // Set default button styles with text content
  element.settings = {
    style: "primary",
    tag: "button",
    size: "md",
    // For buttons with SVG + text, use innerHTML to keep the icon alongside the label.
    // For text-only buttons, use textContent (clean string Bricks renders natively).
    text: hasSvg ? node.innerHTML : (textContent || 'Button')
  };

  // Handle button attributes 
  if (node.hasAttribute('disabled')) {
    element._attributes = element._attributes || [];

    element._attributes.push({
      id: crypto.randomUUID().slice(0, 6),
      name: "disabled",
      value: "true"
    });
  }


  // Prevent processing of child text nodes
  element._skipTextNodes = true;

  return element;
};
