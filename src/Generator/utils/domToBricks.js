import { generateId } from '@lib/bricks';
import { logger } from '@lib/logger';
import { getElementLabel } from '@lib/bricks';
import { ALERT_CLASS_PATTERNS, CONTAINER_CLASS_PATTERNS } from '@config/constants';
import { buildCssMap, parseCssDeclarations, matchCSSSelectors, matchCSSSelectorsPerClass, mapCssPropertiesToBricksPseudo, parsePseudoFromSelector, appendCustomCss } from '@generator/utils/cssParser';
import { processFormElement } from "@generator/elementProcessors/formProcessor"
import { processAudioElement } from '@generator/elementProcessors/audioProcessor';
import { processVideoElement } from '@generator/elementProcessors/videoProcessor';
import { processTableElement } from '@generator/elementProcessors/tableProcessor';
import { processImageElement } from '@generator/elementProcessors/imageProcessor';
import { processSvgElement } from '@generator/elementProcessors/svgProcessor';
import { processHeadingElement } from '@generator/elementProcessors/headingProcessor';
import { processListElement } from '@generator/elementProcessors/listProcessor';
import { processLinkElement } from '@generator/elementProcessors/linkProcessor';
import { getLinkSettings } from '@generator/elementProcessors/linkUtils';
import { processButtonElement } from '@generator/elementProcessors/buttonProcessor';
import { processMiscElement } from '@generator/elementProcessors/miscProcessor';
import { processStructureLayoutElement } from '@generator/elementProcessors/structureLayoutProcessor';
import { processTextElement } from '@generator/elementProcessors/textElementProcessor';
import { processAttributes } from '@generator/elementProcessors/attributeProcessor';
import { processAlertElement } from '@generator/elementProcessors/alertProcessor';
import { processNavElement } from '@generator/elementProcessors/navProcessor';


// Helper function to check if element has alert-related classes
const hasAlertClasses = (node) => {
  if (!node.classList || node.classList.length === 0) return false;

  const classes = Array.from(node.classList);

  // Check for exact matches only
  return ALERT_CLASS_PATTERNS.some(pattern =>
    classes.includes(pattern)
  );
};

// Helper function to check if element has container/layout classes
const hasContainerClasses = (node) => {
  if (!node.classList || node.classList.length === 0) return false;

  return CONTAINER_CLASS_PATTERNS.some(cls => node.classList.contains(cls));
};

const handleInlineStyles = (node, element, globalClasses, variables = {}, options = {}) => {

  const styleAttr = node.getAttribute('style');
  logger.log(' Inline styles for element:', options?.context?.inlineStyleHandling);
  if (!styleAttr || !styleAttr.trim()) return;

  switch (options?.context?.inlineStyleHandling) {
    case 'skip':
      // Do nothing - skip the inline styles completely
      logger.log('Skipping inline styles for element:', element.id);
      // Remove the style attribute
      node.removeAttribute('style');
      break;

    case 'inline':
      // This case is now handled in processAttributes
      logger.log('Inline styles handled in processAttributes for element:', element.id);
      // Remove the style attribute since processAttributes already added it
      node.removeAttribute('style');
      break;

    case 'class': {
      // Find the first global class for this element
      let targetClass = null;
      if (element.settings._cssGlobalClasses && element.settings._cssGlobalClasses.length > 0) {
        const firstClassId = element.settings._cssGlobalClasses[0];
        targetClass = globalClasses.find(c => c.id === firstClassId);
      }

      // Convert inline styles to a class and merge with existing settings
      logger.log('Converting inline styles to class for element:', element.id, styleAttr, targetClass?.name, variables);

      if (targetClass) {
        // Parse the inline styles
        const parsedInlineStyles = parseCssDeclarations(styleAttr, targetClass.name, variables);

        // Ensure _typography exists in the target class
        if (!targetClass.settings._typography) {
          targetClass.settings._typography = {};
        }

        // Deep merge the inline styles with existing styles
        if (parsedInlineStyles._typography) {
          targetClass.settings._typography = {
            ...targetClass.settings._typography, // Keep existing typography
            ...parsedInlineStyles._typography,   // Apply inline styles on top
          };
        }

        // Merge any other settings (like _cssCustom, etc.)
        Object.entries(parsedInlineStyles).forEach(([key, value]) => {
          if (key !== '_typography') {
            if (targetClass.settings[key] && typeof targetClass.settings[key] === 'object' && !Array.isArray(targetClass.settings[key])) {
              // Merge objects
              targetClass.settings[key] = {
                ...targetClass.settings[key],
                ...value
              };
            } else {
              // Overwrite primitives and arrays
              targetClass.settings[key] = value;
            }
          }
        });
      } else {
        // No class exists - add inline styles as custom CSS
        logger.log('No target class found, adding inline styles as custom CSS');

        // Parse inline styles and convert to custom CSS
        const styleDeclarations = styleAttr.split(';').filter(s => s.trim());
        // Add to element's custom CSS or settings
        if (!element.settings._cssCustom) {
          element.settings._cssCustom = '';
        }

        // Use element ID or tag as selector
        const selector = element.settings._cssId ? `#${element.settings._cssId}` : '%root%';
        
        styleDeclarations.forEach(s => {
          const colonIndex = s.indexOf(':');
          if (colonIndex > -1) {
            const prop = s.substring(0, colonIndex).trim();
            const val = s.substring(colonIndex + 1).trim();
            if (prop && val) {
              appendCustomCss(element.settings, selector, prop, val);
            }
          }
        });
      }

      // Remove the style attribute since we've processed it
      node.removeAttribute('style');
      break;
    }

    default:
      logger.warn('Unknown inlineStyleHandling value:', options?.context?.inlineStyleHandling);
      break;
  }
};

/**
 * Processes a DOM node and converts it to a Bricks element
 */
const domNodeToBricks = (node, cssRulesMap = {}, parentId = '0', globalClasses = [], allElements = [], variables = {}, options = {}, path = '0') => {
  // Get context values from options with defaults
  const {
    inlineStyleHandling = 'inline',
    showNodeClass = false
  } = options.context || {};
  // Debug logs
  logger.log('Context in domNodeToBricks:', { showNodeClass, inlineStyleHandling });
  // Handle text nodes
  if (node.nodeType !== Node.ELEMENT_NODE) {
    // Skip text nodes that are inside a form element (labels, button text, etc.)
    // or inside a heading element
    if ((node.parentElement && node.parentElement.closest &&
      (node.parentElement.closest('form') ||
        node.parentElement.matches('h1, h2, h3, h4, h5, h6'))) ||
      !node.textContent.trim()) {
      return null;
    }

    // Skip text nodes if parent is a div that should handle text content directly
    // (divs with only text/emoji content should not create separate text elements)
    const parent = node.parentElement;
    if (parent && parent.tagName && parent.tagName.toLowerCase() === 'div') {
      // Check if parent div has only text content (no element children)
      const hasOnlyText = Array.from(parent.childNodes).every(
        child => child.nodeType === Node.TEXT_NODE || 
          (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '')
      );
      
      // If parent div has classes or only text, let the parent handle it
      // Don't create separate text element for simple text/emoji inside divs
      if (hasOnlyText && parent.className && typeof parent.className === 'string' && parent.className.trim()) {
        return null;
      }
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const textElement = {
        id: `brx-text-${path}`,
        name: 'text-basic',
        parent: parentId,
        children: [],
        settings: {
          text: node.textContent.trim(),
          tag: 'p'
        }
      };
      allElements.push(textElement);
      return textElement;
    }
    return null;
  }

  const tag = node.tagName.toLowerCase();

  // -------------------------------------------------------------------
  // Skip entirely-empty p/span elements that the HTML parser injects for
  // invalid markup (e.g. a bare <p> before a block element).  DO NOT
  // skip elements that carry classes or attributes — those are valid,
  // intentional elements (e.g. icon-only spans, color-swatch spans, etc.)
  // that rely purely on CSS for their visual output.
  // -------------------------------------------------------------------
  if (['p', 'span'].includes(tag)
      && node.textContent.trim() === ''
      && node.children.length === 0
      && (!node.className || node.className.trim() === '')
      && node.attributes.length === 0) {
    return null;
  }

  // -------------------------------------------------------------------
  // Early-exit: skip all descendants inside a <form> that Bricks' form
  // element already models internally — avoids duplicate nodes.
  // This must run BEFORE element creation and child traversal.
  // -------------------------------------------------------------------
  if (node.closest('form')) {
    // Always skip native form controls and list wrappers inside forms
    if (['input', 'select', 'textarea', 'button', 'label',
         'ul', 'ol', 'li', 'fieldset', 'legend'].includes(tag)) {
      return null;
    }
    // Skip <div> wrappers whose children are exclusively form controls
    // (e.g. div.form-group > label + input, div.options-wrapper > li)
    if (tag === 'div') {
      const childTags = Array.from(node.children).map(c => c.tagName.toLowerCase());
      const allFormControls = childTags.length > 0 && childTags.every(t =>
        ['input', 'select', 'textarea', 'button', 'label', 'ul', 'ol', 'li'].includes(t)
      );
      if (allFormControls) return null;
    }
  }

  // Include all divs in the output, even empty ones
  // We'll handle empty divs by setting appropriate defaults

  let name = 'div';
  
  // Create a more specific stable ID: tag + first-class + path
  const firstClass = node.className && typeof node.className === 'string' 
    ? `-${node.className.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '')}` 
    : '';
  const elementId = `brx-${tag}${firstClass}-${path}`;
  
  const element = {
    id: elementId,
    name,
    parent: parentId,
    children: [],
    settings: {}
  };

  // Check if this is a standalone inline element that should be converted to text-basic
  const isStandaloneInline = ['strong', 'em', 'small', 'blockquote'].includes(tag) &&
    node.parentElement &&
    !['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'div', 'section', 'article', 'aside', 'header', 'footer', 'nav'].includes(node.parentElement.tagName.toLowerCase());

  if (isStandaloneInline) {
    const textElement = {
      id: generateId(),
      name: 'text-basic',
      parent: parentId,
      children: [],
      settings: {
        text: node.textContent.trim(),
        tag: 'custom',
        customTag: tag
      }
    };

    allElements.push(textElement);
    return textElement;
  }

  // Check for alert elements first (higher priority)
  if (tag === 'div' && hasAlertClasses(node)) {
    return processAlertElement(node, options.context || {});
  }
  // Check for nav elements — only process as nav-nested if it has actual <a> links
  if (tag === 'nav' || (tag === 'div' && (
    node.classList.contains('nav') ||
    node.classList.contains('menu') ||
    node.classList.contains('navigation') ||
    node.classList.contains('links') ||
    node.classList.contains('navbar') ||
    node.classList.contains('main-nav') ||
    node.classList.contains('primary-nav') ||
    node.classList.contains('header-nav') ||
    node.classList.contains('site-nav') ||
    node.classList.contains('top-nav') ||
    node.classList.contains('subnav') ||
    node.classList.contains('submenu') ||
    node.classList.contains('breadcrumb') ||
    node.classList.contains('pagination')
  ))) {
    // Only use nav-nested when there are actual <a> link children
    // (not just buttons) — prevents hero__actions nav from being swallowed
    const hasLinks = node.querySelectorAll('a').length > 0;
    if (hasLinks) {
      return processNavElement(node, {
        context: options.context || {},
        cssRulesMap: cssRulesMap,
        globalClasses: globalClasses,
        variables: variables
      });
    }
    // Fall through to generic div/section handling for button-only navs
  }
  // Structure/layout elements — now includes ALL semantic layout tags
  else if (['section', 'article', 'aside', 'main', 'header', 'footer', 'figure',
            'nav'].includes(tag) ||
    node.classList.contains('container') ||
    node.classList.contains('row') ||
    node.classList.contains('col-') ||
    node.classList.contains('section') ||
    (tag === 'div' && hasContainerClasses(node))) {
    processStructureLayoutElement(node, element, tag, options.context || {});
  }
  else if (tag === 'div') {
    // A div whose ONLY content is text (no child elements) should be a
    // Bricks text-basic so the text is not silently discarded.
    if (node.children.length === 0 && node.textContent.trim() !== '') {
      element.name = 'text-basic';
      element.settings.text = node.textContent.trim();
      element.settings.tag = 'div'; // keep div tag for CSS class targeting
      element._skipChildren = true;
    } else {
      // Process as generic div if no special classes are present
      element.name = 'div';
      element.label = getElementLabel(node, 'Div', options.context || {});
      element.settings.tag = 'div';
    }
  }
  else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    processHeadingElement(node, element, tag, options.context || {});
  }
  else if (['time', 'mark', 'span', 'address', 'p', 'blockquote',
            'kbd', 'samp', 'var', 'cite', 'dfn', 'del', 'ins',
            'sub', 'sup', 'abbr', 'q'].includes(tag)) {
    processTextElement(node, element, tag, allElements, options.context || {});
  }
  else if (['a'].includes(tag)) {
    // Check if anchor contains only text nodes
    const hasOnlyText = Array.from(node.childNodes).every(n => n.nodeType === Node.TEXT_NODE);
    if (hasOnlyText) {
      processLinkElement(node, element, tag, options.context || {});
    } else {
      // Use div brick with link settings
      element.name = 'div';
      element.settings.tag = 'a';
      // Always treat href as a custom URL (including hash anchors)
      element.settings.link = getLinkSettings(node);
      // Process and nest children
      Array.from(node.childNodes).forEach((childNode, index) => {
        const childElement = domNodeToBricks(childNode, cssRulesMap, elementId, globalClasses, allElements, variables, options, `${path}-${index}`);
        if (childElement) {
          if (Array.isArray(childElement)) {
            childElement.forEach(c => {
              element.children.push(c.id);
              if (!allElements.some(e => e.id === c.id)) allElements.push(c);
            });
          } else {
            element.children.push(childElement.id);
            if (!allElements.some(e => e.id === childElement.id)) allElements.push(childElement);
          }
        }
      });

      // Mark that children have been processed to avoid double processing
      element._skipChildren = true;
    }
  }
  else if (tag === 'img') {
    processImageElement(node, element, tag, options.context || {});
  }
  else if (tag === 'button') {
    processButtonElement(node, element, tag, options.context || {});
  }
  else if (tag === 'svg') {
    processSvgElement(node, element, tag, options.context || {});
    element._skipChildren = true; // SVG children are already included in outerHTML
  }
  else if (tag === 'form') {
    const formElement = processFormElement(node, options.context || {});
    formElement.id = elementId;
    formElement.parent = parentId;
    Object.assign(element, formElement);
    // Mark that children have been processed to avoid double processing
    element._skipChildren = true;
  }
  // Handle standalone form inputs/selects/textareas (not inside a form tag)
  // Instead of wrapping them in a fake form, output as custom code
  else if (['input', 'select', 'textarea'].includes(tag) && !node.closest('form')) {
    const type = node.getAttribute('type')?.toLowerCase();

    // Skip hidden inputs
    if (type === 'hidden') {
      return null;
    }

    // Output the raw HTML as a Bricks custom code element.
    // executeCode: true — the PHP engine echos all non-PHP content literally,
    // so raw HTML inside the code block renders correctly in the page.
    element.name = 'code';
    element.settings = {
      code: node.outerHTML,
      executeCode: true,
      signature: crypto.randomUUID().replace(/-/g, '').substring(0, 32),
      user_id: 1,
      time: Math.floor(Date.now() / 1000)
    };
    element._skipChildren = true;
  }
  else if (['table', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'].includes(tag)) {
    processTableElement(node, element, tag, options.context || {});
    // col elements have no children — respect _skipChildren set by processTableElement
    // Note: Don't return early for td/th here - let CSS processing happen first
  }
  else if (['ul', 'ol', 'li'].includes(tag)) {
    processListElement(node, element, tag, options.context || {});
    // Note: Don't return early here - let CSS processing happen first
  }
  else if (tag === 'audio') {
    processAudioElement(node, element, options.context || {});
  }
  else if (tag === 'video') {
    processVideoElement(node, element, options.context || {});
  }
  else if (tag === 'code') {
    // <code> HTML tag → Bricks custom code element (rendered inside parent, no noRoot)
    element.name = 'code';
    element.settings = {
      code: node.innerHTML || node.textContent || '',
      executeCode: true,
      signature: crypto.randomUUID().replace(/-/g, '').substring(0, 32),
      user_id: 1,
      time: Math.floor(Date.now() / 1000)
    };
    element._skipChildren = true;
  }
  else if (['canvas', 'details', 'summary', 'dialog', 'meter', 'progress', 'script'].includes(tag)) {
    processMiscElement(node, element, tag, options.context || {});
  }
  // Definition list elements
  else if (['dl', 'dt', 'dd'].includes(tag)) {
    element.name = 'div';
    element.settings.tag = 'custom';
    element.settings.customTag = tag;
    element.label = tag === 'dl' ? 'Definition List' : tag === 'dt' ? 'Term' : 'Definition';
    // dl itself should not skip children
  }
  // figcaption — rendered with its semantic tag so CSS targeting works
  else if (tag === 'figcaption') {
    element.name = 'div';
    element.settings.tag = 'custom';
    element.settings.customTag = 'figcaption';
    element.label = 'Figure Caption';
  }
  // details/summary — interactive disclosure elements.
  // Render as div containers so Bricks preserves structure; CSS/JS can style them.
  else if (['details', 'summary'].includes(tag)) {
    element.name = 'div';
    element.settings.tag = 'custom';
    element.settings.customTag = tag;
    element.label = tag === 'details' ? 'Details' : 'Summary';
  }
  // noRoot rendering suppression issues inside parent containers.
  // Browsers tolerate </hr> and </br> closing tags gracefully.
  else if (['br', 'wbr', 'hr'].includes(tag)) {
    element.name = 'div';
    element.settings.tag = 'custom';
    element.settings.customTag = tag;
    element.label = tag === 'hr' ? 'Horizontal Rule' : tag === 'br' ? 'Line Break' : 'Word Break';
    element._skipChildren = true;
  }

  // Process children (only skip td/th to avoid duplication, allow other table elements to process children)
  // Skip traversing children for table cells, forms, and elements that handle their own text content
  if (!['td', 'th', 'form'].includes(tag) && !element._skipTextNodes && !element._skipChildren) {
    Array.from(node.childNodes).forEach((childNode, index) => {
      // Skip empty text nodes and text nodes when the parent handles its own text content
      if (childNode.nodeType === Node.TEXT_NODE && (!childNode.textContent.trim() || element._skipTextNodes)) {
        return;
      }
      // Skip processing text nodes for elements that handle their own text content
      if (element._skipTextNodes && childNode.nodeType === Node.TEXT_NODE) {
        return;
      }
      const childElement = domNodeToBricks(childNode, cssRulesMap, elementId, globalClasses, allElements, variables, options, `${path}-${index}`);
      if (childElement) {
        if (Array.isArray(childElement)) {
          // Nav (and other array-returning processors) — push ALL sub-elements to allElements
          // so Bricks can locate each element by ID when building the content tree.
          childElement.forEach(c => {
            element.children.push(c.id);
            if (!allElements.some(e => e.id === c.id)) allElements.push(c);
          });
        } else {
          element.children.push(childElement.id);
        }
      }
    });
  }

  // Skip all structural descendants inside a <form> — Bricks' form element already models
  // all fields via processFormElement; re-processing them creates duplicate nodes.
  // (Primary guard is the early-exit above; this is a safety net.)
  if (node.closest('form') && [
    'input', 'select', 'textarea', 'button', 'label',
    'ul', 'ol', 'li', 'fieldset', 'legend'
  ].includes(tag)) {
    return null;
  }


  // ------------------------------------------------------------------
  // CSS CLASS / STYLE AGGREGATION
  // ------------------------------------------------------------------
  // Get all matching CSS properties for this element
  const matchResult = matchCSSSelectors(node, cssRulesMap);
  const combinedProperties = matchResult.properties || matchResult; // Handle both old and new format
  const pseudoSelectors = matchResult.pseudoSelectors || [];

  // Automatically use ID-based targeting if element has an ID
  const hasId = element.settings._cssId;
  const cssSelectorTarget = hasId ? 'id' : (options.cssSelectorTarget || 'class');

  if (cssSelectorTarget === 'id') {
    // Apply styles directly to the element's ID
    if (Object.keys(combinedProperties).length > 0) {
      const parsedSettings = parseCssDeclarations(combinedProperties, '%root%', variables);
      Object.assign(element.settings, parsedSettings);
    }

    // Handle pseudo-elements for ID
    if (pseudoSelectors.length > 0) {
      let customCss = '';
      pseudoSelectors.forEach(({ selector, properties, pseudo }) => {
        // Parse properties to object if needed
        const propsObject = typeof properties === 'object' ? properties
          : typeof properties === 'string'
            ? (() => {
              const r = {};
              properties.split(';').filter(p => p.trim()).forEach(decl => {
                const ci = decl.indexOf(':');
                if (ci > 0) { r[decl.substring(0, ci).trim()] = decl.substring(ci + 1).trim(); }
              });
              return r;
            })()
            : {};

        // If we have pseudo metadata from the matcher, use natve mapping
        if (pseudo) {
          const { mapped, unmapped } = mapCssPropertiesToBricksPseudo(propsObject, pseudo);

          // Apply mapped properties natively to the element settings
          Object.entries(mapped).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              if (!element.settings[key]) element.settings[key] = {};
              Object.assign(element.settings[key], value);
            } else {
              element.settings[key] = value;
            }
          });

          // Unmapped properties go to custom CSS
          if (Object.keys(unmapped).length > 0) {
            const propsFormatted = Object.entries(unmapped)
              .map(([p, v]) => `${p}: ${v}`).join(';\n  ');
            const escapedSelector = selector.replace(/\./g, '\\.');
            customCss += `${escapedSelector} {\n  ${propsFormatted};\n}\n`;
          }
        } else {
          // Fallback: add as regular custom CSS
          const propsFormatted = Object.entries(propsObject)
            .map(([p, v]) => `${p}: ${v}`).join(';\n  ');
          const escapedSelector = selector.replace(/\./g, '\\.');
          customCss += `${escapedSelector} {\n  ${propsFormatted};\n}\n`;
        }
      });
      if (customCss) {
        element.settings._cssCustom = (element.settings._cssCustom || '') + customCss;
      }
    }

    // Handle pseudo-classes for ID
    Object.keys(cssRulesMap).forEach(selector => {
      const pseudoMatch = selector.match(new RegExp(`^#${node.id}:(\\w+)`));
      if (pseudoMatch) {
        const pseudoClass = pseudoMatch[1];
        const pseudoStyles = parseCssDeclarations(cssRulesMap[selector], '%root%', variables);
        Object.entries(pseudoStyles).forEach(([prop, value]) => {
          element.settings[`${prop}:${pseudoClass}`] = value;
        });
      }

      // Handle pseudo-classes for tag selectors
      const tagPseudoMatch = selector.match(new RegExp(`^${tag}:(\\w+)`));
      if (tagPseudoMatch) {
        const pseudoClass = tagPseudoMatch[1];
        const pseudoStyles = parseCssDeclarations(cssRulesMap[selector], '%root%', variables);
        Object.entries(pseudoStyles).forEach(([prop, value]) => {
          element.settings[`${prop}:${pseudoClass}`] = value;
        });
      }
    });
  } else {
    // Process element attributes FIRST so they're available for class transfer
    processAttributes(node, element, tag, options);

    // Apply styles via global classes using per-class matching
    const existingClasses = node.classList && node.classList.length > 0 ? Array.from(node.classList) : [];
    const randomId = Math.random().toString(36).substring(2, 6);
    const generatedClass = existingClasses.length === 0 ? `${tag}-tag-${randomId}-class` : null;
    const classNames = generatedClass ? [generatedClass, ...existingClasses] : existingClasses;
    const cssGlobalClasses = [];

    // Use per-class matching to distribute properties correctly
    const perClassMatch = matchCSSSelectorsPerClass(node, cssRulesMap, existingClasses);
    const { propertiesByClass, commonProperties, pseudoSelectors: perClassPseudos } = perClassMatch;

    classNames.forEach((cls, index) => {
      let targetClass = globalClasses.find(c => c.name === cls);
      if (!targetClass) {
        targetClass = { id: generateId(), name: cls, settings: {} };
        globalClasses.push(targetClass);
      }

      // Get class-specific properties
      const classProperties = propertiesByClass[cls] || {};

      // For the first class, also include common properties (tag, id, attribute selectors)
      const propertiesToAssign = index === 0
        ? { ...commonProperties, ...classProperties }
        : classProperties;

      if (Object.keys(propertiesToAssign).length > 0) {
        const parsedSettings = parseCssDeclarations(propertiesToAssign, cls, variables);
        Object.assign(targetClass.settings, parsedSettings);
      }

      // Handle pseudo-selectors for the first class only
      if (index === 0 && perClassPseudos.length > 0) {
        let customCss = '';
        perClassPseudos.forEach(({ selector, properties, pseudo, baseSelector: psBase }) => {
          const isMergeableSelector = options.context?.mergeNonClassSelectors;

          // Parse string properties to object helper
          const parseStringProps = (props) => {
            if (typeof props === 'object') return props;
            if (typeof props !== 'string') return {};
            const result = {};
            props.split(';').filter(p => p.trim()).forEach(decl => {
              const colonIndex = decl.indexOf(':');
              if (colonIndex > 0) {
                const prop = decl.substring(0, colonIndex).trim();
                const val = decl.substring(colonIndex + 1).trim();
                if (prop && val) result[prop] = val;
              }
            });
            return result;
          };

          // Format properties helper for custom CSS output
          const formatProps = (props) => {
            if (typeof props === 'string') {
              return props.split(';').filter(p => p.trim()).join(';\n  ');
            } else if (typeof props === 'object') {
              return Object.entries(props).map(([p, v]) => `${p}: ${v}`).join(';\n  ');
            }
            return '';
          };

          // ---- Pseudo selectors (with pseudo metadata from matcher) ----
          if (pseudo) {
            // Parse properties to object
            const propsObject = parseStringProps(properties);

            // Determine which class to target: use the base selector's class if it matches
            const pseudoParsed = parsePseudoFromSelector(selector);
            const baseForClass = pseudoParsed.baseSelector || psBase || '';

            // Check if the base selector directly matches a class on this element
            const isSimpleClassMatch = baseForClass.startsWith('.') &&
              node.classList.contains(baseForClass.substring(1));
            const isIdMatch = baseForClass === `#${node.id}`;
            const isTagMatch = baseForClass === tag;

            // Check if selector contains a class that matches this element
            const classMatches = baseForClass.match(/\.([a-zA-Z0-9_-]+)/g);
            const containsMatchingClass = classMatches && classMatches.some(c =>
              node.classList.contains(c.substring(1))
            );

            if (isSimpleClassMatch || isIdMatch || isTagMatch) {
              // Direct match — map to native Bricks pseudo settings
              const { mapped, unmapped } = mapCssPropertiesToBricksPseudo(propsObject, pseudo);

              // Apply mapped properties to the target class settings
              Object.entries(mapped).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  if (!targetClass.settings[key]) targetClass.settings[key] = {};
                  Object.assign(targetClass.settings[key], value);
                } else {
                  targetClass.settings[key] = value;
                }
              });

              // Unmapped properties go to custom CSS
              if (Object.keys(unmapped).length > 0) {
                const propsFormatted = Object.entries(unmapped)
                  .map(([p, v]) => `${p}: ${v}`).join(';\n  ');
                customCss += `${selector} {\n  ${propsFormatted};\n}\n`;
              }
            } else if (isMergeableSelector && (containsMatchingClass || baseForClass.startsWith('[') || baseForClass.includes('['))) {
              // Merge pseudo styles for complex selectors with matching class
              const { mapped, unmapped } = mapCssPropertiesToBricksPseudo(propsObject, pseudo);

              Object.entries(mapped).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  if (!targetClass.settings[key]) targetClass.settings[key] = {};
                  Object.assign(targetClass.settings[key], value);
                } else {
                  targetClass.settings[key] = value;
                }
              });

              if (Object.keys(unmapped).length > 0) {
                const propsFormatted = Object.entries(unmapped)
                  .map(([p, v]) => `${p}: ${v}`).join(';\n  ');
                customCss += `${selector} {\n  ${propsFormatted};\n}\n`;
              }
            } else {
              // Non-matching selector — add as custom CSS
              const propsFormatted = formatProps(properties);
              customCss += `${selector} {\n  ${propsFormatted};\n}\n`;
            }
          } else {
            // ---- Non-pseudo selectors (complex selectors, etc.) ----
            // Handle complex selectors (child >, attribute [], descendant, multiple, etc.)
            const isTagSelector = selector === tag;
            const isAttributeSelector = selector.startsWith('[') || selector.includes('[');
            // Check if selector contains a class that matches this element
            const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
            const containsMatchingClass = classMatches && classMatches.some(c =>
              node.classList.contains(c.substring(1))
            );

            if (isMergeableSelector && (isTagSelector || containsMatchingClass || isAttributeSelector)) {
              // When merge is enabled, merge complex selector styles into the class
              const propsObject = parseStringProps(properties);
              const combinedStyles = parseCssDeclarations(propsObject, selector, variables);
              Object.assign(targetClass.settings, combinedStyles);
            } else {
              // Add as custom CSS - preserve the full selector
              const propsFormatted = formatProps(properties);
              customCss += `${selector} {\n  ${propsFormatted};\n}\n`;
            }
          }
        });
        if (customCss) {
          targetClass.settings._cssCustom = (targetClass.settings._cssCustom || '') + customCss;
        }
      }

      // Handle pseudo-classes for each specific class
      Object.keys(cssRulesMap).forEach(selector => {
        const pseudoMatch = selector.match(new RegExp(`^\\.${cls}:(\\w+)`));
        if (pseudoMatch) {
          const pseudoClass = pseudoMatch[1];
          const pseudoStyles = parseCssDeclarations(cssRulesMap[selector], cls, variables);
          Object.entries(pseudoStyles).forEach(([prop, value]) => {
            targetClass.settings[`${prop}:${pseudoClass}`] = value;
          });
        }

        // Handle pseudo-classes for tag selectors when processing the first (generated) class
        if (index === 0) {
          const tagPseudoMatch = selector.match(new RegExp(`^${tag}:(\\w+)`));
          if (tagPseudoMatch) {
            const pseudoClass = tagPseudoMatch[1];
            const pseudoStyles = parseCssDeclarations(cssRulesMap[selector], tag, variables);
            Object.entries(pseudoStyles).forEach(([prop, value]) => {
              targetClass.settings[`${prop}:${pseudoClass}`] = value;
            });
          }
        }
      });

      if (!cssGlobalClasses.includes(targetClass.id)) {
        cssGlobalClasses.push(targetClass.id);
      }
    });

    if (cssGlobalClasses.length > 0) {
      element.settings._cssGlobalClasses = cssGlobalClasses;

      // Update label to use class name if showNodeClass is enabled
      if (options.context?.showNodeClass) {
        const firstClass = globalClasses.find(c => c.id === cssGlobalClasses[0]);
        if (firstClass) {
          element.label = firstClass.name;
        }
      }
    }
  }

  // Pass the options to handleInlineStyles
  handleInlineStyles(node, element, globalClasses, variables, options);

  // Special handling for simple lists that were converted to text elements
  // They need to return early AFTER CSS processing
  if (['ul', 'ol'].includes(tag) && element.name === 'text') {
    allElements.push(element);
    return element;
  }

  // Special handling for table cells (td, th) - return AFTER CSS processing
  if (['td', 'th'].includes(tag)) {
    allElements.push(element);
    return element;
  }

  allElements.push(element);
  return element;
};

/**
 * Converts HTML and CSS to Bricks structure
 */
const convertHtmlToBricks = (html, css, options) => {
  try {
    let doc;
    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(html, 'text/html');
    } else {
      const JSDOM = globalThis.require?.('jsdom')?.JSDOM;
      if (!JSDOM) {
        throw new Error('jsdom is not available in this environment');
      }
      const dom = new JSDOM(`<!DOCTYPE html>${html}`);
      doc = dom.window.document;
      if (typeof globalThis.Node === 'undefined') globalThis.Node = dom.window.Node;
    }

    const { cssMap, variables, rootStyles, keyframes, mediaQueries } = buildCssMap(css);

    const content = [];
    const globalClasses = [];
    const allElements = [];

    const processNodes = nodeList => {
      Array.from(nodeList).forEach(node => {
        const element = domNodeToBricks(
          node,
          cssMap,
          '0',
          globalClasses,
          allElements,
          variables,
          {
            ...options,
            context: {
              ...options.context, // Spread existing context first
              showNodeClass: options.context?.showNodeClass || false,
              inlineStyleHandling: options.context?.inlineStyleHandling || 'inline',
              mergeNonClassSelectors: options.context?.mergeNonClassSelectors || false,
              activeTab: options.context?.activeTab || 'html'
            }
          }
        );
        if (element) {
          if (Array.isArray(element)) {
            content.push(...element);
          } else {
            content.push(element);
          }
        }
      });
    };

    processNodes(doc.body.childNodes);
    // Also process head nodes like <script> when body is empty
    if (content.length === 0) {
      processNodes(doc.head.childNodes);
    }
    // Add allElements to content (for nested elements from special processors)
    allElements.forEach(el => {
      if (!content.some(c => c.id === el.id)) {
        content.push(el);
      }
    });

    // Helper to add CSS to first element's class or create new class
    const addCustomCss = (cssContent) => {
      let targetClass = null;
      if (content.length > 0 && content[0].settings._cssGlobalClasses) {
        const firstElementClassId = content[0].settings._cssGlobalClasses[0];
        targetClass = globalClasses.find(c => c.id === firstElementClassId);
      }

      if (targetClass) {
        if (!targetClass.settings._cssCustom) {
          targetClass.settings._cssCustom = '';
        }
        targetClass.settings._cssCustom = `${targetClass.settings._cssCustom}\n${cssContent}`.trim();
      } else if (globalClasses.length > 0) {
        const firstClass = globalClasses[0];
        if (!firstClass.settings._cssCustom) {
          firstClass.settings._cssCustom = '';
        }
        firstClass.settings._cssCustom = `${firstClass.settings._cssCustom}\n${cssContent}`.trim();
      } else {
        globalClasses.push({
          id: generateId(),
          name: 'custom-css',
          settings: {
            _cssCustom: cssContent,
          },
        });
      }
    };

    // Add root styles
    if (rootStyles) {
      addCustomCss(rootStyles);
    }

    // Add media queries as custom CSS
    if (mediaQueries && mediaQueries.length > 0) {
      const mediaQueryCSS = mediaQueries.join('\n\n');
      addCustomCss(mediaQueryCSS);
    }

    // Handle @keyframes rules
    if (keyframes && keyframes.length > 0) {
      const keyframesCSS = keyframes.map(kf => kf.rule).join('\n\n');

      // Find the first top-level element's class to add keyframes
      let targetClass = null;
      if (content.length > 0 && content[0].settings._cssGlobalClasses) {
        const firstElementClassId = content[0].settings._cssGlobalClasses[0];
        targetClass = globalClasses.find(c => c.id === firstElementClassId);
      }

      // Add keyframes to the target class or first global class
      if (targetClass) {
        if (!targetClass.settings._cssCustom) {
          targetClass.settings._cssCustom = '';
        }
        targetClass.settings._cssCustom = `${targetClass.settings._cssCustom}\n\n${keyframesCSS}`.trim();
      } else if (globalClasses.length > 0) {
        const firstClass = globalClasses[0];
        if (!firstClass.settings._cssCustom) {
          firstClass.settings._cssCustom = '';
        }
        firstClass.settings._cssCustom = `${firstClass.settings._cssCustom}\n\n${keyframesCSS}`.trim();
      } else {
        // Create a new global class for keyframes if none exists
        globalClasses.push({
          id: generateId(),
          name: 'animations',
          settings: {
            _cssCustom: keyframesCSS,
          },
        });
      }
    }

    return {
      content,
      source: 'bricksCopiedElements',
      sourceUrl: 'https://brickify.netlify.app',
      version: '2.0',
      globalClasses,
      globalElements: []
    };
  } catch (error) {
    logger.error('HTML to Bricks conversion failed', {
      file: 'domToBricks.js',
      step: 'convertHTMLToBricks',
      feature: 'DOM Parsing & Structure Generation'
    }, error);
    throw error;
  }
};

export { domNodeToBricks, convertHtmlToBricks };
