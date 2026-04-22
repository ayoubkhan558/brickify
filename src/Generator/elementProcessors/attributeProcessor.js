import { generateId } from '@lib/bricks';
import { getLinkSettings, normalizeTargetValue } from '@generator/elementProcessors/linkUtils';
import { GLOBAL_ATTRIBUTES, ELEMENT_SPECIFIC_ATTRIBUTES, BOOLEAN_ATTRIBUTES } from '@config/constants';

const GLOBAL_ATTRIBUTES_SET = new Set(GLOBAL_ATTRIBUTES);
const BOOLEAN_ATTRIBUTES_SET = new Set(BOOLEAN_ATTRIBUTES);
const ALWAYS_SKIP_ATTRIBUTES = new Set(['id', 'class', 'style']);
const TAG_SKIP_ATTRIBUTES = {
  a: new Set(['href']),
  img: new Set(['src', 'alt'])
};

/**
 * Processes element attributes into Bricks settings
 */
export const processAttributes = (node, element, tag, options = {}) => {
  const customAttributes = [];
  const tagSpecificAttributes = new Set(ELEMENT_SPECIFIC_ATTRIBUTES[tag] || []);

  if (tag === 'a' && node.hasAttribute('href')) {
    element.settings.link = getLinkSettings(node);
  }

  if (node.hasAttribute('id')) {
    element.settings._cssId = node.getAttribute('id');
  }

  // Process style attribute based on inlineStyleHandling
  if (node.hasAttribute('style')) {
    const style = node.getAttribute('style').trim();
    if (!style) return; // Skip if style is empty

    const inlineStyleHandling = options.inlineStyleHandling || options.context?.inlineStyleHandling || 'inline';

    // Only process as attribute if inlineStyleHandling is 'inline'
    if (inlineStyleHandling === 'inline') {
      // For 'inline' mode, we'll keep the styles as inline styles
      element.settings._attributes = element.settings._attributes || [];
      element.settings._attributes.push({
        id: generateId(),
        name: 'style',
        value: style
      });
    }
    // For 'class' and 'skip' modes, don't add to attributes - let handleInlineStyles deal with it
    // Don't remove the style attribute here - let handleInlineStyles handle removal
  }

  const normalizeAttributeValue = (attrName, rawValue) => {
    if (attrName === 'target') {
      return normalizeTargetValue(rawValue);
    }

    if (!BOOLEAN_ATTRIBUTES_SET.has(attrName)) {
      return rawValue ?? '';
    }

    const normalized = String(rawValue ?? '').trim().toLowerCase();
    if (normalized === '' || normalized === attrName.toLowerCase()) return 'true';
    if (['false', '0', 'no', 'off'].includes(normalized)) return 'false';
    if (['true', '1', 'yes', 'on'].includes(normalized)) return 'true';
    return 'true';
  };

  const shouldSkipAttribute = (attrName) => {
    if (attrName.startsWith('data-bricks-')) return true;
    if (ALWAYS_SKIP_ATTRIBUTES.has(attrName)) return true;
    return TAG_SKIP_ATTRIBUTES[tag]?.has(attrName) || false;
  };

  // Process other attributes
  if (tag === 'svg') return;

  Array.from(node.attributes).forEach(attr => {
    const attrName = attr.name.toLowerCase();
    if (attrName === 'style') return; // Skip style as it's already processed above
    if (shouldSkipAttribute(attrName)) return;

    const isKnownAttribute = GLOBAL_ATTRIBUTES_SET.has(attrName) ||
      tagSpecificAttributes.has(attrName) ||
      attrName.startsWith('data-') ||
      attrName.startsWith('aria-');

    if (!isKnownAttribute && options?.context?.skipUnknownAttributes) return;

    customAttributes.push({
      id: generateId(),
      name: attr.name,
      value: normalizeAttributeValue(attrName, attr.value)
    });
  });

  // Merge custom attributes with existing ones (don't overwrite)
  if (customAttributes.length > 0) {
    if (!element.settings._attributes) {
      element.settings._attributes = customAttributes;
    } else {
      // Only add attributes that don't already exist
      customAttributes.forEach(newAttr => {
        const exists = element.settings._attributes.some(existing => existing.name === newAttr.name);
        if (!exists) {
          element.settings._attributes.push(newAttr);
        }
      });
    }
  }
};
