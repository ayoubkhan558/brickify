import { getElementLabel } from '@lib/bricks';

/**
 * Helper to check if element contains formatting tags
 * @param {Node} node - The DOM node to check
 * @returns {boolean} True if node contains formatting tags
 */
const hasFormattingTags = (node) => {
  // Inline formatting tags that should trigger rich text mode
  const formattingTags = ['strong', 'em', 'b', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup', 'del', 'ins', 'code', 'kbd', 'var', 'samp', 'abbr', 'cite', 'q', 'dfn', 'span', 'a'];

  // Check if any child elements are formatting tags OR any non-text child elements exist
  // (e.g. SVG icons inside spans/paragraphs). Any child element means innerHTML is needed
  // to preserve the nested markup in the Bricks rich-text field.
  const children = Array.from(node.children || []);
  return children.length > 0 && (
    children.some(child => formattingTags.includes(child.tagName.toLowerCase())) ||
    children.some(child => ['svg', 'img', 'picture', 'video', 'audio'].includes(child.tagName.toLowerCase()))
  );
};

/**
 * Processes text-related elements (p, span, address, time, mark, blockquote, kbd, abbr, etc.)
 * @param {Node} node - The DOM node to process
 * @param {Object} element - The element object to populate
 * @param {string} tag - The HTML tag name
 * @param {Array} allElements - Array of all elements being processed
 * @param {Object} context - Optional context values (showNodeClass, etc.)
 * @returns {Object|null} The processed element or null if invalid
 */
export const processTextElement = (node, element, tag, allElements, context = {}) => {
  const textContent = node.textContent.trim();
  const hasFormatting = hasFormattingTags(node);

  // Handle inline elements within paragraphs
  const isInlineInParagraph = ['strong', 'em', 'small'].includes(tag) &&
    node.parentElement?.tagName?.toLowerCase() === 'p';

  if (isInlineInParagraph) {
    // For inline elements inside paragraphs, use custom tags
    element.settings.text = textContent;
    element.name = 'text-basic';
    element.label = getElementLabel(node, tag === 'strong' ? 'Bold Text' :
      tag === 'em' ? 'Italic Text' : 'Small Text', context);

    // Use custom tag for semantic meaning
    element.settings.tag = 'custom';
    element.settings.customTag = tag;

    element._skipTextNodes = true;
    return element;
  }

  // Handle standalone block elements
  if (['p', 'blockquote'].includes(tag)) {
    // Check if element has formatting tags - if so, use rich text
    if (hasFormatting) {
      element.settings.text = node.innerHTML; // Use innerHTML to preserve formatting
      element.name = 'text'; // Use rich text element
      element.label = getElementLabel(node, tag === 'p' ? 'Paragraph' : 'Block Quote', context);
    } else {
      element.settings.text = textContent;
      element.name = 'text-basic';
      element.label = getElementLabel(node, tag === 'p' ? 'Paragraph' : 'Block Quote', context);
    }

    if (tag === 'blockquote') {
      element.settings.tag = 'custom';
      element.settings.customTag = 'blockquote';
    } else {
      element.settings.tag = tag;
    }

    element._skipTextNodes = true;
    return element;
  }

  // Handle semantic inline elements that should be rendered as custom-tag text-basic
  // These are inline elements that carry semantic meaning: kbd, abbr, del, ins, sub, sup, etc.
  const semanticInlineTags = ['kbd', 'samp', 'var', 'cite', 'dfn', 'del', 'ins', 'sub', 'sup', 'abbr', 'q'];
  if (semanticInlineTags.includes(tag)) {
    // Use innerHTML to preserve any inner formatting (e.g. nested tags)
    const hasInnerFormatting = node.children.length > 0;
    element.settings.text = hasInnerFormatting ? node.innerHTML : textContent;
    element.name = hasInnerFormatting ? 'text' : 'text-basic';
    element.label = getElementLabel(node, tag.toUpperCase(), context);
    element.settings.tag = 'custom';
    element.settings.customTag = tag;
    // For abbr, preserve the title attribute — it will be picked up by processAttributes
    // but we mark it here explicitly for clarity
    element._skipTextNodes = true;
    return element;
  }

  // Default case for other elements (span, time, mark, address, etc.)
  // -----------------------------------------------------------------
  // CASE 1: Pure CSS/decoration element — no text, no child elements, but
  // HAS classes or attributes (e.g. color swatches, status dots, separators).
  // Bricks silently drops text-basic elements whose text field is empty, so
  // we render these as a div[customTag=<tag>] shell instead. This lets CSS
  // target the element class while still emitting a real Bricks DOM node.
  if (!textContent && !hasFormatting) {
    element.name = 'div';
    element.settings.tag = 'custom';
    element.settings.customTag = tag; // preserve tag (span, time, mark, …)
    element.label = getElementLabel(node, 'Decorator', context);
    element._skipChildren = true;
    return element;
  }

  // CASE 2: Rich inline element — has child elements (SVG, a, strong, etc.).
  // Use innerHTML to capture nested markup; set _skipChildren so the children
  // loop does NOT also process them as separate Bricks elements.
  if (hasFormatting) {
    element.settings.text = node.innerHTML;
    element.name = 'text';
    element.label = getElementLabel(node, 'Rich Text', context);
    element._skipChildren = true; // children already in innerHTML — don't double-process
  } else {
    // CASE 3: Plain text element.
    element.settings.text = textContent;
    element.name = 'text-basic';
    element.label = getElementLabel(node, 'Text', context);
  }

  // Preserve semantic tags that have meaning beyond 'span'
  // span and other generic inline elements use the 'span' tag
  // but time, mark, address, abbr, etc. should keep their native tag
  const SEMANTIC_BLOCK_TAGS = ['address'];
  const SEMANTIC_INLINE_TAGS = ['time', 'mark', 'kbd', 'abbr', 'del', 'ins',
                                 'sub', 'sup', 'samp', 'var', 'cite', 'dfn', 'q'];

  if (SEMANTIC_INLINE_TAGS.includes(tag) || SEMANTIC_BLOCK_TAGS.includes(tag)) {
    element.settings.tag = 'custom';
    element.settings.customTag = tag;
  } else {
    element.settings.tag = 'span';
  }

  element._skipTextNodes = true;

  return element;
};
