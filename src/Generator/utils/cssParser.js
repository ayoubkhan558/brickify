// cssParser.js
// CSS parsing utilities
import { displayMappers } from '@generator/cssPropertyMappers/display';
import { gridMappers } from '@generator/cssPropertyMappers/content-grid';
import { flexboxMappers } from '@generator/cssPropertyMappers/content-flexbox';
import { spacingMappers } from '@generator/cssPropertyMappers/layout-spacing';
import { sizingMappers } from '@generator/cssPropertyMappers/layout-sizing';
import { positionMappers } from '@generator/cssPropertyMappers/layout-position';
import { layoutMiscMappers } from '@generator/cssPropertyMappers/layout-misc';
import { typographyMappers } from '@generator/cssPropertyMappers/typography';
import { backgroundMappers } from '@generator/cssPropertyMappers/background';
import { borderBoxShadowMappers } from '@generator/cssPropertyMappers/boder-box-shadow';
import { filterMappers, effectsMappers, transitionsMappers } from '@generator/cssPropertyMappers/filters-transitions';
import { scrollSnapMappers } from '@generator/cssPropertyMappers/layout-scroll-snap';
import { transformsMappers } from '@generator/cssPropertyMappers/transforms';
import { logger } from '@lib/logger';
import * as csstree from 'css-tree';


const expandMalformedDeclaration = (decl) => {
  const parts = [];
  let current = decl.trim();

  while (current) {
    const colonIndex = current.indexOf(':');
    if (colonIndex === -1) {
      break;
    }

    const prop = current.slice(0, colonIndex).trim();
    let value = current.slice(colonIndex + 1).trim();

    const nextPropMatch = value.match(/\s([a-z-]+)\s*:/i);
    if (nextPropMatch && prop) {
      const splitAt = nextPropMatch.index;
      const validValue = value.slice(0, splitAt).trim();
      parts.push(`${prop}: ${validValue}`);
      current = value.slice(splitAt + 1).trim();
      continue;
    }

    parts.push(`${prop}: ${value}`);
    break;
  }

  return parts.length ? parts : [decl];
};

/**
 * Intelligently appends a CSS property to settings._cssCustom, grouping by selector.
 * @param {Object} settings - Bricks element/class settings object
 * @param {string} selector - CSS selector (e.g., 'root', '.my-class')
 * @param {string} prop - CSS property name
 * @param {string} val - CSS property value
 */
export const appendCustomCss = (settings, selector, prop, val) => {
  if (!settings._cssCustom) settings._cssCustom = '';
  
  const normalizedSelector = selector || 'root';
  const escapedSelector = normalizedSelector.replace(/\./g, '\\.');
  const fullSelector = (escapedSelector === 'root' || escapedSelector === ':root' || escapedSelector === '%root%' || escapedSelector.startsWith('#')) 
    ? escapedSelector 
    : `.${escapedSelector}`;

  // Find if a block for this selector already exists
  // We look for the selector followed by { ... }
  // We use a non-greedy match for the content to avoid capturing multiple blocks
  const selectorEscapedForRegex = fullSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRegex = new RegExp(`(${selectorEscapedForRegex})\\s*\\{\\s*([^}]*?)\\s*\\}`, 'g');
  
  let lastMatch = null;
  let match;
  while ((match = blockRegex.exec(settings._cssCustom)) !== null) {
    lastMatch = {
      index: match.index,
      fullMatch: match[0],
      selector: match[1],
      content: match[2]
    };
  }

  if (lastMatch) {
    // Append to the existing block
    const existingProps = lastMatch.content.trim();
    const separator = existingProps && !existingProps.endsWith(';') ? ';' : '';
    const updatedProps = `${existingProps}${separator}\n  ${prop}: ${val};`;
    const updatedBlock = `${fullSelector} {\n  ${updatedProps}\n}`;
    
    // Replace the last occurrence of this block
    settings._cssCustom = settings._cssCustom.substring(0, lastMatch.index) + 
                         updatedBlock + 
                         settings._cssCustom.substring(lastMatch.index + lastMatch.fullMatch.length);
  } else {
    // Add a new block
    const separator = settings._cssCustom.trim() ? '\n\n' : '';
    settings._cssCustom += `${separator}${fullSelector} {\n  ${prop}: ${val};\n}`;
  }
};



// =====================================================================
// Pseudo-Selector Utilities
// =====================================================================

/**
 * Bricks-supported pseudo-classes (single colon)
 * These map to settings keys like `_typography:hover`, `_background:active`, etc.
 */
export const BRICKS_PSEUDO_CLASSES = [
  'hover', 'active', 'focus', 'visited', 'disabled',
  'empty', 'first-child', 'last-child', 'first-of-type', 'last-of-type',
  'only-child', 'only-of-type', 'nth-child', 'nth-last-child',
  'nth-of-type', 'nth-last-of-type', 'not', 'checked', 'invalid',
  'valid', 'required', 'optional', 'read-only', 'read-write',
  'focus-within', 'focus-visible', 'any-link', 'link',
];

/**
 * Bricks-supported pseudo-elements (double colon — also accept single-colon legacy syntax)
 * These map to settings keys like `_typography::before`, `_content::before`, etc.
 */
export const BRICKS_PSEUDO_ELEMENTS = [
  'before', 'after', 'first-line', 'first-letter',
  'placeholder', 'selection', 'marker', 'backdrop',
];

/**
 * Normalize legacy single-colon pseudo-element selectors to double-colon.
 * e.g. `.foo:before` → `.foo::before`, `.bar:after` → `.bar::after`
 * Does NOT touch pseudo-classes like `:hover`.
 */
export function normalizePseudoSelector(selector) {
  // Match single-colon pseudo-elements and promote to double-colon
  // We need a negative lookbehind for `:` so we don't touch `::` that's already correct
  return selector.replace(
    new RegExp(`(?<!:):(${BRICKS_PSEUDO_ELEMENTS.join('|')})(?![\\w-])`, 'g'),
    '::$1'
  );
}

/**
 * Extract the base selector and the pseudo part from a full selector.
 * Handles both pseudo-classes (`:hover`) and pseudo-elements (`::before`).
 *
 * @param {string} selector - Full CSS selector like `.card::before` or `.btn:hover`
 * @returns {{ baseSelector: string, pseudo: string, pseudoType: 'element'|'class'|null }}
 */
export function parsePseudoFromSelector(selector) {
  // Normalize first
  const normalized = normalizePseudoSelector(selector);

  // Try pseudo-element first (::before, ::after, etc.)
  const pseudoElementMatch = normalized.match(
    /^(.+?)(::(?:[a-zA-Z][a-zA-Z0-9-]*))(?:\(([^)]*)\))?$/
  );
  if (pseudoElementMatch) {
    const pseudoPart = pseudoElementMatch[2] + (pseudoElementMatch[3] ? `(${pseudoElementMatch[3]})` : '');
    return {
      baseSelector: pseudoElementMatch[1].trim(),
      pseudo: pseudoPart,         // e.g. "::before"
      pseudoRaw: pseudoPart.replace(/^::/, ''),  // e.g. "before"
      pseudoType: 'element'
    };
  }

  // Try pseudo-class (:hover, :nth-child(2), etc.)
  // Must not match `::` (already handled above)
  const pseudoClassMatch = normalized.match(
    /^(.+?)(:(?:[a-zA-Z][a-zA-Z0-9-]*)(?:\([^)]*\))?)$/
  );
  if (pseudoClassMatch) {
    const pseudoPart = pseudoClassMatch[2];
    return {
      baseSelector: pseudoClassMatch[1].trim(),
      pseudo: pseudoPart,         // e.g. ":hover"
      pseudoRaw: pseudoPart.replace(/^:/, ''),  // e.g. "hover"
      pseudoType: 'class'
    };
  }

  return { baseSelector: selector, pseudo: null, pseudoRaw: null, pseudoType: null };
}

/**
 * Map a set of CSS properties to Bricks native pseudo settings.
 *
 * @param {Object} propsObject  – e.g. { color: 'red', 'font-size': '14px', content: '""' }
 * @param {string} pseudo       – The pseudo suffix, e.g. "::before" or ":hover"
 * @returns {{ mapped: Object, unmapped: Object }}
 *   - mapped:  Bricks settings keyed like `_typography::before`
 *   - unmapped: CSS properties that couldn't be mapped natively
 */
export function mapCssPropertiesToBricksPseudo(propsObject, pseudo) {
  const mapped = {};
  const unmapped = {};

  Object.entries(propsObject).forEach(([prop, val]) => {
    // --- content property (only meaningful for ::before / ::after) ---
    if (prop === 'content') {
      mapped[`_content${pseudo}`] = val.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      return;
    }

    // --- Typography-related ---
    const typographyProps = [
      'color', 'font-size', 'font-weight', 'font-style', 'font-family',
      'line-height', 'letter-spacing', 'text-align', 'text-transform',
      'text-decoration', 'white-space', 'text-wrap', 'text-shadow',
      'word-spacing', 'text-indent', 'text-overflow', 'word-break',
      'font-variant'
    ];
    if (typographyProps.includes(prop)) {
      const key = `_typography${pseudo}`;
      if (!mapped[key]) mapped[key] = {};
      if (prop === 'color') {
        mapped[key].color = { raw: val };
      } else if (prop === 'font-size') {
        mapped[key]['font-size'] = val;
      } else if (prop === 'font-weight') {
        mapped[key]['font-weight'] = val;
      } else if (prop === 'font-style') {
        mapped[key]['font-style'] = val;
      } else if (prop === 'font-family') {
        mapped[key]['font-family'] = val;
      } else if (prop === 'line-height') {
        mapped[key]['line-height'] = val;
      } else if (prop === 'letter-spacing') {
        mapped[key]['letter-spacing'] = val;
      } else if (prop === 'text-align') {
        mapped[key]['text-align'] = val;
      } else if (prop === 'text-transform') {
        mapped[key]['text-transform'] = val;
      } else if (prop === 'text-decoration') {
        mapped[key]['text-decoration'] = val;
      } else if (prop === 'text-shadow') {
        mapped[key]['text-shadow'] = val;
      } else {
        // Remaining typography props go as-is
        mapped[key][prop] = val;
      }
      return;
    }

    // --- Background-related ---
    const backgroundProps = [
      'background', 'background-color', 'background-image', 'background-repeat',
      'background-size', 'background-position', 'background-attachment',
      'background-blend-mode', 'background-origin', 'background-clip',
      '-webkit-background-clip',
    ];
    if (backgroundProps.includes(prop)) {
      const key = `_background${pseudo}`;
      if (!mapped[key]) mapped[key] = {};
      if (prop === 'background-color' || prop === 'background') {
        mapped[key].color = { raw: val };
      } else if (prop === 'background-image') {
        mapped[key].image = { url: val };
      } else {
        mapped[key][prop] = val;
      }
      return;
    }

    // --- Border-related ---
    const borderProps = [
      'border', 'border-width', 'border-style', 'border-color',
      'border-radius', 'border-top-width', 'border-right-width',
      'border-bottom-width', 'border-left-width',
      'border-top-color', 'border-right-color',
      'border-bottom-color', 'border-left-color',
    ];
    if (borderProps.includes(prop)) {
      const key = `_border${pseudo}`;
      if (!mapped[key]) mapped[key] = {};
      if (prop === 'border-color') {
        mapped[key].color = { raw: val };
      } else if (prop === 'border-radius') {
        mapped[key].radius = val;
      } else if (prop === 'border-width') {
        mapped[key].width = val;
      } else if (prop === 'border-style') {
        mapped[key].style = val;
      } else {
        mapped[key][prop] = val;
      }
      return;
    }

    // --- Box shadow ---
    if (prop === 'box-shadow') {
      mapped[`_boxShadow${pseudo}`] = val;
      return;
    }

    // --- Layout / sizing / spacing ---
    const layoutProps = [
      'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
      'opacity', 'overflow', 'overflow-x', 'overflow-y', 'visibility',
      'pointer-events', 'cursor',
    ];
    if (layoutProps.includes(prop)) {
      // These get the pseudo suffix directly on the Bricks setting key
      // e.g. _width::before, _opacity:hover
      const bricksProp = `_${prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase())}`;
      mapped[`${bricksProp}${pseudo}`] = val;
      return;
    }

    // --- Transform ---
    if (prop === 'transform') {
      mapped[`_transform${pseudo}`] = val;
      return;
    }

    // --- Transition ---
    if (prop === 'transition') {
      mapped[`_transition${pseudo}`] = val;
      return;
    }

    // --- Filter / backdrop-filter ---
    if (prop === 'filter' || prop === 'backdrop-filter') {
      const bricksProp = prop === 'filter' ? '_cssFilter' : '_backdropFilter';
      mapped[`${bricksProp}${pseudo}`] = val;
      return;
    }

    // --- Flex / grid item props ---
    const flexGridProps = [
      'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      'align-content', 'flex-grow', 'flex-shrink', 'flex-basis',
      'align-self', 'order', 'gap', 'row-gap', 'column-gap',
      'grid-column', 'grid-row', 'grid-area',
    ];
    if (flexGridProps.includes(prop)) {
      const bricksProp = `_${prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase())}`;
      mapped[`${bricksProp}${pseudo}`] = val;
      return;
    }

    // --- Unmapped: will go into custom CSS ---
    unmapped[prop] = val;
  });

  return { mapped, unmapped };
}



// CSS properties Bricks has native controls for and how to map them
export const getCssPropMappers = (settings) => {
  const mappers = {
    'display': displayMappers['display'],
    // Layout Mappers
    // Layout - Spacing - Margin - Padding
    'margin': spacingMappers['margin'],
    'margin-top': spacingMappers['margin-top'],
    'margin-right': spacingMappers['margin-right'],
    'margin-bottom': spacingMappers['margin-bottom'],
    'margin-left': spacingMappers['margin-left'],
    'padding': spacingMappers['padding'],
    'padding-top': spacingMappers['padding-top'],
    'padding-right': spacingMappers['padding-right'],
    'padding-bottom': spacingMappers['padding-bottom'],
    'padding-left': spacingMappers['padding-left'],
    // Layout - Sizing
    'width': sizingMappers['width'],
    'height': sizingMappers['height'],
    'min-width': sizingMappers['min-width'],
    'max-width': sizingMappers['max-width'],
    'min-height': sizingMappers['min-height'],
    'max-height': sizingMappers['max-height'],
    'aspect-ratio': sizingMappers['aspect-ratio'],
    // Layout - Position
    'position': positionMappers['position'],
    'top': positionMappers['top'],
    'right': positionMappers['right'],
    'bottom': positionMappers['bottom'],
    'left': positionMappers['left'],
    'z-index': positionMappers['z-index'],
    // Layout- Scroll Snap
    'scroll-snap-type': scrollSnapMappers['scroll-snap-type'],
    'scroll-snap-align': scrollSnapMappers['scroll-snap-align'],
    'scroll-snap-stop': scrollSnapMappers['scroll-snap-stop'],
    // Layout - Misc
    'pointer-events': layoutMiscMappers['pointer-events'],
    'mix-blend-mode': layoutMiscMappers['mix-blend-mode'],
    'isolation': layoutMiscMappers['isolation'],
    'cursor': layoutMiscMappers['cursor'],
    'opacity': layoutMiscMappers['opacity'],
    'overflow': layoutMiscMappers['overflow'],
    'overflow-x': layoutMiscMappers['overflow-x'],
    'overflow-y': layoutMiscMappers['overflow-y'],
    'visibility': layoutMiscMappers['visibility'],
    'box-sizing': layoutMiscMappers['box-sizing'],
    'animation': layoutMiscMappers['animation'],
    // End Layout Mappers

    // Typography
    'color': typographyMappers['color'],
    'font-size': typographyMappers['font-size'],
    'font-weight': typographyMappers['font-weight'],
    'font-style': typographyMappers['font-style'],
    'font-family': typographyMappers['font-family'],
    'line-height': typographyMappers['line-height'],
    'letter-spacing': typographyMappers['letter-spacing'],
    'text-align': typographyMappers['text-align'],
    'text-transform': typographyMappers['text-transform'],
    'text-decoration': typographyMappers['text-decoration'],
    'white-space': typographyMappers['white-space'],
    'text-wrap': typographyMappers['text-wrap'],
    'text-shadow': typographyMappers['text-shadow'],
    'font-variant': typographyMappers['font-variant'],
    'word-spacing': typographyMappers['word-spacing'],
    'list-style': typographyMappers['list-style'],
    'list-style-type': typographyMappers['list-style-type'],
    'list-style-position': typographyMappers['list-style-position'],
    'list-style-image': typographyMappers['list-style-image'],

    // Background
    'background-color': backgroundMappers['background-color'],
    'background-image': backgroundMappers['background-image'],
    'background-repeat': backgroundMappers['background-repeat'],
    'background-size': backgroundMappers['background-size'],
    'background-position': backgroundMappers['background-position'],
    'background-attachment': backgroundMappers['background-attachment'],
    'background-blend-mode': backgroundMappers['background-blend-mode'],
    'background-origin': backgroundMappers['background-origin'],
    'background-clip': backgroundMappers['background-clip'],
    '-webkit-background-clip': backgroundMappers['-webkit-background-clip'],
    'background': backgroundMappers['background'],

    // Border
    'box-shadow': borderBoxShadowMappers['box-shadow'],
    'border': borderBoxShadowMappers['border'],
    'border-width': borderBoxShadowMappers['border-width'],
    'border-style': borderBoxShadowMappers['border-style'],
    'border-color': borderBoxShadowMappers['border-color'],
    'border-top-width': borderBoxShadowMappers['border-top-width'],
    'border-right-width': borderBoxShadowMappers['border-right-width'],
    'border-bottom-width': borderBoxShadowMappers['border-bottom-width'],
    'border-left-width': borderBoxShadowMappers['border-left-width'],
    'border-radius': borderBoxShadowMappers['border-radius'],
    'border-top-color': borderBoxShadowMappers['border-top-color'],
    'border-right-color': borderBoxShadowMappers['border-right-color'],
    'border-bottom-color': borderBoxShadowMappers['border-bottom-color'],
    'border-left-color': borderBoxShadowMappers['border-left-color'],
    // Does not supported in bricks 
    // 'border-top-left-radius': borderBoxShadowMappers['border-top-left-radius'],
    // 'border-top-right-radius': borderBoxShadowMappers['border-top-right-radius'],
    // 'border-bottom-right-radius': borderBoxShadowMappers['border-bottom-right-radius'],
    // 'border-bottom-left-radius': borderBoxShadowMappers['border-bottom-left-radius'],

    // Transform
    'transform': transformsMappers['transform'],
    'transform-origin': transformsMappers['transform-origin'],
    'transform-style': transformsMappers['transform-style'],
    'perspective': transformsMappers['perspective'],
    'perspective-origin': transformsMappers['perspective-origin'],
    'backface-visibility': transformsMappers['backface-visibility'],

    // CSS Filters - Transition
    'filter': effectsMappers['filter'],
    'backdrop-filter': effectsMappers['backdrop-filter'],
    'blur': filterMappers['blur'],
    'brightness': filterMappers['brightness'],
    'contrast': filterMappers['contrast'],
    'hue-rotate': filterMappers['hue-rotate'],
    'invert': filterMappers['invert'],
    // Note: 'opacity' is handled by layoutMiscMappers, not filterMappers
    'saturate': filterMappers['saturate'],
    'sepia': filterMappers['sepia'],
    // Transition
    'transition': transitionsMappers['transition'],
    'transition-property': transitionsMappers['transition-property'],
    'transition-duration': transitionsMappers['transition-duration'],
    'transition-timing-function': transitionsMappers['transition-timing-function'],
    'transition-delay': transitionsMappers['transition-delay'],

    // CSS Classes & ID
    'css-classes': (val, settings) => {
      settings._cssClasses = val;
    },

    // Special mapper for pseudo-classes
    '_pseudo': (value, settings, pseudoClass) => {
      if (!settings._pseudo) settings._pseudo = {};
      if (!settings._pseudo[pseudoClass]) settings._pseudo[pseudoClass] = {};

      // Handle nested properties for pseudo-classes
      if (value.startsWith('_')) {
        // Handle Bricks-specific properties like _background, _typography
        const [prop, val] = value.split(':').map(s => s.trim());
        settings._pseudo[pseudoClass][prop] = JSON.parse(val);
      } else {
        // Handle regular CSS properties
        const [prop, val] = value.split(':').map(s => s.trim());
        const normalizedProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        const mapper = getCssPropMappers(settings)[prop] || getCssPropMappers(settings)[normalizedProp];

        if (mapper) {
          const pseudoSettings = {};
          mapper(val, pseudoSettings);
          Object.assign(settings._pseudo[pseudoClass], pseudoSettings);
        }
      }
    },

    // Grid item properties (always available since any element can be a grid item)
    'grid-column': gridMappers['grid-column'],
    'grid-row': gridMappers['grid-row'],
    'grid-area': gridMappers['grid-area'],
    'justify-self': gridMappers['justify-self'],
    'align-self': gridMappers['align-self'],
  };

  if (settings._display === 'grid') {
    Object.assign(mappers, {
      'grid-gap': gridMappers['grid-gap'],
      'grid-row-gap': gridMappers['grid-row-gap'],
      'grid-column-gap': gridMappers['grid-column-gap'],
      'grid-template-columns': gridMappers['grid-template-columns'],
      'grid-template-rows': gridMappers['grid-template-rows'],
      'grid-template-areas': gridMappers['grid-template-areas'],
      'grid-auto-columns': gridMappers['grid-auto-columns'],
      'grid-auto-rows': gridMappers['grid-auto-rows'],
      'grid-auto-flow': gridMappers['grid-auto-flow'],
      'justify-items': gridMappers['justify-items'],
      'gap': gridMappers['gap'] // Use the mapper from gridMappers instead of inline
    });
  } else {
    Object.assign(mappers, {
      'flex-direction': flexboxMappers['flex-direction'],
      'flex-wrap': flexboxMappers['flex-wrap'],
      'justify-content': flexboxMappers['justify-content'],
      'align-items': flexboxMappers['align-items'],
      'align-content': flexboxMappers['align-content'],
      'flex-grow': flexboxMappers['flex-grow'],
      'flex-shrink': flexboxMappers['flex-shrink'],
      'flex-basis': flexboxMappers['flex-basis'],
      'align-self': flexboxMappers['align-self'],
      'order': flexboxMappers['order'],
      'gap': flexboxMappers['gap'], // Use the mapper from flexboxMappers instead of inline
      'row-gap': flexboxMappers['row-gap'],
      'column-gap': flexboxMappers['column-gap']
    });
  }

  return mappers;
};

// Parse CSS declarations into Bricks settings
export function parseCssDeclarations(combinedProperties, className = '', variables = {}) {
  const settings = {};
  const customRules = {};

  const resolveCssVariables = (value) => {
    if (typeof value !== 'string' || !value.includes('var(')) {
      return value;
    }

    // Recursively resolve CSS variables (handle nested var() calls)
    let resolved = value;
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;

    while (resolved.includes('var(') && iteration < maxIterations) {
      const previousResolved = resolved;
      resolved = resolved.replace(/var\((--[\w-]+)\)/g, (match, varName) => {
        return variables[varName] || match;
      });

      // If nothing changed, break to avoid infinite loop
      if (previousResolved === resolved) {
        break;
      }
      iteration++;
    }

    return resolved;
  };

  // Handle combined properties object
  if (typeof combinedProperties === 'object') {
    Object.entries(combinedProperties).forEach(([prop, value]) => {
      const resolvedValue = resolveCssVariables(value);
      const normalizedProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const CSS_PROP_MAPPERS = getCssPropMappers(settings);
      const mapper = CSS_PROP_MAPPERS[prop] || CSS_PROP_MAPPERS[normalizedProp];

      if (mapper) {
        try {
          mapper(resolvedValue, settings);
        } catch {
          logger.error(`CSS property processing failed`, {
            file: 'cssParser.js',
            step: 'processStyles - mapper execution',
            feature: `CSS: ${prop} = "${resolvedValue}"`
          });
          if (!customRules[prop]) customRules[prop] = {};
          customRules[prop][resolvedValue] = true;
        }
      } else {
        if (!customRules[prop]) customRules[prop] = {};
        customRules[prop][resolvedValue] = true;
      }
    });
  } else {
    // Handle CSS string
    const commentlessCss = combinedProperties.replace(/\/\*[\s\S]*?\*\//g, '');
    const cleanCss = commentlessCss.replace(/\s+/g, ' ').replace(/\s*([:;{}])\s*/g, '$1').trim();
    const declarations = cleanCss.split(';').filter(Boolean).flatMap(expandMalformedDeclaration);

    declarations.forEach(decl => {
      if (!decl.trim()) return;

      const colonIndex = decl.indexOf(':');
      if (colonIndex === -1) return;

      const prop = decl.slice(0, colonIndex).trim();
      const value = decl.slice(colonIndex + 1).trim();

      if (!prop || !value) return;

      const resolvedValue = resolveCssVariables(value);
      const normalizedProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const CSS_PROP_MAPPERS = getCssPropMappers(settings);
      const mapper = CSS_PROP_MAPPERS[prop] || CSS_PROP_MAPPERS[normalizedProp];

      if (mapper) {
        try {
          mapper(resolvedValue, settings);
        } catch {
          logger.error(`CSS property processing failed`, {
            file: 'cssParser.js',
            step: 'processInlineStyles - mapper execution',
            feature: `CSS: ${prop} = "${resolvedValue}"`
          });
          if (!customRules[prop]) customRules[prop] = {};
          customRules[prop][resolvedValue] = true;
        }
      } else {
        if (!customRules[prop]) customRules[prop] = {};
        customRules[prop][resolvedValue] = true;
      }
    });
  }

  // Handle custom rules
  const nativeProperties = [
    'padding', 'margin', 'background', 'color', 'font-size', 'border',
    'width', 'height', 'display', 'position', 'top', 'right', 'bottom', 'left', 'box-shadow',
    'opacity', 'overflow', 'transform', 'transition', 'filter', 'backdrop-filter',
    'box-sizing', 'animation'
  ];

  Object.keys(customRules).forEach(property => {
    if (nativeProperties.includes(property)) {
      delete customRules[property];
    }
  });

  if (Object.keys(customRules).length > 0) {
    const fallbackClassName = className || 'root';
    const cssRules = Object.keys(customRules).map(prop => {
      const values = Object.keys(customRules[prop]);
      // Handle border property with rgba values properly
      if (prop === 'border' && values.some(v => v.startsWith('rgba('))) {
        // Use the first rgba value directly
        const rgbaValue = values.find(v => v.startsWith('rgba('));
        return `${prop}: ${rgbaValue}`;
      }
      const joinedValues = values.join(', ');
      return `${prop}: ${joinedValues}`;
    }).join(';\n  ');

    if (!settings._skipTransitionCustom) {
      const selector = (fallbackClassName === ':root' || fallbackClassName === 'root' || fallbackClassName.startsWith('#')) 
        ? fallbackClassName 
        : `.${fallbackClassName.replace(/\./g, '\\.')}`;
      settings._cssCustom = `${selector} {\n  ${cssRules};\n}`;
    }
    settings._skipTransitionCustom = false;
  }

  return settings;
}

// Enhanced CSS matching function
export function matchCSSSelectors(element, cssMap) {
  const combinedProperties = {};
  const doc = element.ownerDocument;
  const unmatchedSelectors = []; // Store selectors that need to be added as custom CSS

  // Helper to parse CSS properties string into object
  const parseProperties = (propertiesString) => {
    if (typeof propertiesString === 'object') return propertiesString;
    const properties = {};
    const declarations = propertiesString.split(';').filter(decl => decl.trim());

    declarations.forEach(decl => {
      const colonIndex = decl.indexOf(':');
      if (colonIndex > 0) {
        const property = decl.substring(0, colonIndex).trim();
        const value = decl.substring(colonIndex + 1).trim();
        if (property && value) {
          properties[property] = value;
        }
      }
    });

    return properties;
  };

  // Helper: check if element matches base selector (with fallback)
  const elementMatchesBase = (baseSelector) => {
    try {
      return element.matches(baseSelector);
    } catch {
      try {
        const matchingElements = doc.querySelectorAll(baseSelector);
        return Array.from(matchingElements).includes(element);
      } catch {
        return false;
      }
    }
  };

  // Check each CSS selector against the element
  Object.entries(cssMap).forEach(([selector, properties]) => {
    try {
      let matches = false;

      // --- Pseudo-selector detection (handles both :: and : for pseudo-elements) ---
      const pseudoParsed = parsePseudoFromSelector(selector);

      if (pseudoParsed.pseudo) {
        const { baseSelector, pseudo } = pseudoParsed;

        // Check if the base selector matches the element
        matches = elementMatchesBase(baseSelector);
        if (!matches) return;

        // Parse css properties
        const propsObject = parseProperties(properties);

        // Map CSS properties to Bricks native pseudo settings
        const { mapped, unmapped } = mapCssPropertiesToBricksPseudo(propsObject, pseudo);

        // Merge mapped properties into combinedProperties
        Object.entries(mapped).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (!combinedProperties[key]) combinedProperties[key] = {};
            Object.assign(combinedProperties[key], value);
          } else {
            combinedProperties[key] = value;
          }
        });

        // Unmapped properties go to custom CSS
        if (Object.keys(unmapped).length > 0) {
          unmatchedSelectors.push({ selector: normalizePseudoSelector(selector), properties: unmapped });
        }
        return;
      }

      // --- Regular selectors (no pseudo) ---
      // Try to match the selector
      try {
        matches = element.matches(selector);

        // If selector is a descendant/complex selector, treat it as custom CSS
        // to preserve the relationship (e.g., ".hero-content p" should not apply to <p> directly)
        const selectorType = getSelectorType(selector);
        if (matches && selectorType === 'complex') {
          // This is a complex selector that matches - add to custom CSS instead
          unmatchedSelectors.push({ selector, properties });
          return; // Don't add to combinedProperties
        }
      } catch {
        // If selector is invalid for matches(), try alternative methods
        const selectorType = getSelectorType(selector);

        if (selectorType === 'tag' && element.tagName.toLowerCase() === selector.toLowerCase()) {
          matches = true;
        } else if (selectorType === 'class' && element.classList.contains(selector.substring(1))) {
          matches = true;
        } else if (selectorType === 'id' && element.id === selector.substring(1)) {
          matches = true;
        } else if (selectorType === 'complex') {
          // For complex selectors, add to custom CSS instead of trying to apply directly
          try {
            const matchingElements = doc.querySelectorAll(selector);
            const doesMatch = Array.from(matchingElements).includes(element);
            if (doesMatch) {
              unmatchedSelectors.push({ selector, properties });
            }
          } catch {
            // If still fails, skip this selector
          }
          return; // Don't add to combinedProperties
        }
      }

      if (matches) {
        const parsedProperties = parseProperties(properties);
        Object.assign(combinedProperties, parsedProperties);
      }
    } catch (error) {
      logger.warn(`Error processing selector: ${selector}`, error);
    }
  });

  return { properties: combinedProperties, pseudoSelectors: unmatchedSelectors };
}

/**
 * Enhanced CSS matching that returns properties grouped by class name
 * Uses native browser APIs (element.matches) for reliable selector matching
 * @param {Element} element - DOM element
 * @param {Object} cssMap - CSS map
 * @param {Array} classList - Array of class names on the element
 * @returns {Object} { propertiesByClass, commonProperties, pseudoSelectors }
 */
export function matchCSSSelectorsPerClass(element, cssMap, classList) {
  const propertiesByClass = {}; // Properties grouped by class name
  const commonProperties = {}; // Properties from non-class selectors (tag, id, etc.)
  const unmatchedSelectors = []; // Complex selectors, pseudo-classes, etc.

  // Helper to parse CSS properties string into object
  const parseProperties = (propertiesString) => {
    const properties = {};
    const declarations = propertiesString.split(';').filter(decl => decl.trim());

    declarations.forEach(decl => {
      const colonIndex = decl.indexOf(':');
      if (colonIndex > 0) {
        const property = decl.substring(0, colonIndex).trim();
        const value = decl.substring(colonIndex + 1).trim();
        if (property && value) {
          properties[property] = value;
        }
      }
    });

    return properties;
  };

  // Helper to safely check if element matches a selector
  const elementMatches = (selector) => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  };

  // Helper to extract the primary class from a selector
  const extractPrimaryClass = (selector) => {
    const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
    if (classMatches) {
      // Return the first class that exists on the element
      for (const cls of classMatches) {
        const className = cls.substring(1);
        if (classList.includes(className)) {
          return className;
        }
      }
    }
    return null;
  };

  // Helper to check if selector is a pseudo-class/pseudo-element
  const isPseudoSelector = (selector) => {
    return selector.includes(':');
  };

  // Helper to check if selector is "simple" (just .class, #id, or tag)
  const isSimpleSelector = (selector) => {
    // Simple: .class, #id, tag (no spaces, combinators, attributes, or pseudo)
    return /^(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|[a-zA-Z0-9]+)$/.test(selector);
  };

  // Helper to check if selector is a compound class selector (.class1.class2)
  const isCompoundClassSelector = (selector) => {
    return /^(\.[a-zA-Z0-9_-]+){2,}$/.test(selector);
  };

  // Process all selectors in the cssMap
  Object.entries(cssMap).forEach(([selector, properties]) => {
    try {
      // Skip :root selector
      if (selector === ':root') {
        return;
      }

      const parsedProperties = parseProperties(properties);

      // 1. Handle simple class selectors (.card)
      if (isSimpleSelector(selector) && selector.startsWith('.')) {
        const className = selector.substring(1);
        if (classList.includes(className)) {
          if (!propertiesByClass[className]) {
            propertiesByClass[className] = {};
          }
          Object.assign(propertiesByClass[className], parsedProperties);
        }
        return;
      }

      // 2. Handle compound class selectors (.class1.class2)
      if (isCompoundClassSelector(selector)) {
        if (elementMatches(selector)) {
          const targetClass = extractPrimaryClass(selector);
          if (targetClass) {
            if (!propertiesByClass[targetClass]) {
              propertiesByClass[targetClass] = {};
            }
            Object.assign(propertiesByClass[targetClass], parsedProperties);
          }
        }
        return;
      }

      // 3. Handle pseudo-selectors (::before, :before, ::after, :after, :hover, etc.)
      if (isPseudoSelector(selector)) {
        const pseudoParsed = parsePseudoFromSelector(selector);
        if (pseudoParsed.pseudo) {
          const { baseSelector, pseudo } = pseudoParsed;
          if (elementMatches(baseSelector)) {
            // Push with normalized selector and parsed properties + pseudo metadata
            unmatchedSelectors.push({
              selector: normalizePseudoSelector(selector),
              properties,
              pseudo,             // e.g. "::before" or ":hover"
              baseSelector,       // e.g. ".card"
            });
          }
        }
        return;
      }

      // 4. Handle simple tag/id selectors
      if (isSimpleSelector(selector)) {
        if (elementMatches(selector)) {
          Object.assign(commonProperties, parsedProperties);
        }
        return;
      }

      // 5. Handle all other complex selectors using native element.matches()
      // This handles: child (>), descendant ( ), sibling (+, ~), attribute ([])
      if (elementMatches(selector)) {
        // Add to unmatchedSelectors for custom CSS processing
        unmatchedSelectors.push({ selector, properties });
      }

    } catch (error) {
      // Log and skip invalid selectors
      logger.warn(`Error processing selector: ${selector}`, error);
    }
  });

  return {
    propertiesByClass,
    commonProperties,
    pseudoSelectors: unmatchedSelectors
  };
}

// Helper to determine selector type
const getSelectorType = (selector) => {
  // Check for complex selectors FIRST (before class/id check)
  // Complex selectors include: child (>), sibling (+, ~), descendant (space), attribute ([])
  if (selector.includes('>') || selector.includes('+') || selector.includes('~') ||
    selector.includes(' ') || selector.includes('[')) return 'complex';
  if (selector.startsWith('#')) return 'id';
  if (selector.startsWith('.')) return 'class';
  return 'tag';
};


/**
 * Enhanced buildCssMap function using css-tree for proper CSS parsing
 * @param {string} cssText - The CSS content
 * @returns {Object} Map of selectors to their CSS declarations
 */
export function buildCssMap(cssText) {
  const map = {};
  const variables = {};
  let rootStyles = [];
  const keyframes = [];
  const mediaQueries = [];

  try {
    // Parse CSS using css-tree AST parser
    const ast = csstree.parse(cssText, {
      parseCustomProperty: true,
      parseAtrulePrelude: true,
      parseRulePrelude: true,
      parseValue: true
    });

    // Extract @keyframes and @media rules first
    csstree.walk(ast, {
      visit: 'Atrule',
      enter(node) {
        if (node.name === 'keyframes' || node.name === '-webkit-keyframes') {
          const animationName = node.prelude ? csstree.generate(node.prelude) : '';
          const fullRule = csstree.generate(node);
          keyframes.push({
            name: animationName.trim(),
            rule: fullRule
          });
        }
        // Store media queries as full CSS blocks
        else if (node.name === 'media') {
          const fullMediaRule = csstree.generate(node);
          mediaQueries.push(fullMediaRule);
        }
      }
    });

    // Process only top-level rules (not inside @media)
    // Walk through ast.children directly to avoid nested rules
    if (ast.children) {
      ast.children.forEach(child => {
        // Only process Rule nodes at top level (skip Atrule like @media, @keyframes)
        if (child.type === 'Rule') {
          // Generate selector string
          const selector = csstree.generate(child.prelude);

          // Generate declarations string
          const declarations = [];
          if (child.block && child.block.children) {
            child.block.children.forEach(decl => {
              if (decl.type === 'Declaration') {
                const property = decl.property;
                const value = csstree.generate(decl.value);
                declarations.push(`${property}: ${value}`);

                // Extract CSS variables from :root
                if (selector === ':root' && property.startsWith('--')) {
                  variables[property] = value;
                }
              }
            });
          }

          const propertiesString = declarations.join('; ');

          // Handle multiple selectors separated by comma
          selector.split(',').forEach(sel => {
            // Normalize legacy pseudo-element selectors (:before → ::before, :after → ::after)
            const trimmedSelector = normalizePseudoSelector(sel.trim());
            if (trimmedSelector) {
              map[trimmedSelector] = propertiesString;

              if (trimmedSelector === ':root') {
                rootStyles.push(propertiesString);
              }
            }
          });
        }
      });
    }

  } catch (error) {
    // Log error and return empty result - css-tree handles most cases reliably
    logger.error('CSS parsing failed', error);
    return { cssMap: {}, variables: {}, rootStyles: '', keyframes: [], mediaQueries: [] };
  }

  // Join all root styles with semicolons to maintain valid CSS
  const combinedRootStyles = rootStyles.length > 0 ? `:root {\n  ${rootStyles.join(';\n  ')};\n}` : '';

  return { cssMap: map, variables, rootStyles: combinedRootStyles, keyframes, mediaQueries };
}
