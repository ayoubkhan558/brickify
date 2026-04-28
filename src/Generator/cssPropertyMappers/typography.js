import { parseValue, createColorValue } from '@lib/cssUtils';
import { appendCustomCss } from '@generator/utils/cssParser';

export const typographyMappers = {
  color: (val, settings) => {
    if (val) {
      settings._typography = settings._typography || {};
      settings._typography.color = createColorValue(val);
    }
  },
  'font-size': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['font-size'] = parseValue(val);
  },
  'font-weight': (val, settings) => {
    settings._typography = settings._typography || {};

    // If the value is already a number, use it directly
    if (typeof val === 'number') {
      settings._typography['font-weight'] = val;
      return;
    }

    // Handle string values
    if (typeof val === 'string') {
      const weight = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      const keywordMap = {
        '100': 100, 'thin': 100,
        '200': 200, 'extralight': 200, 'ultralight': 200,
        '300': 300, 'light': 300, 'lighter': 300,
        '400': 400, 'normal': 400, 'regular': 400,
        '500': 500, 'medium': 500,
        '600': 600, 'semibold': 600, 'demibold': 600,
        '700': 700, 'bold': 700, 'bolder': 700,
        '800': 800, 'extrabold': 800, 'ultrabold': 800,
        '900': 900, 'black': 900, 'heavy': 900
      };

      // First try to parse as number
      let numeric = parseInt(weight, 10);

      // If not a valid number, try to map from keywords
      if (isNaN(numeric) || numeric < 100 || numeric > 900) {
        numeric = keywordMap[weight] || 400; // default to 400 if unrecognized
      }

      // Ensure the value is within valid range (100-900, in steps of 100)
      numeric = Math.max(100, Math.min(900, Math.round(numeric / 100) * 100));

      settings._typography['font-weight'] = numeric;
    } else {
      // Fallback to normal weight if value is invalid
      settings._typography['font-weight'] = 400;
    }
  },

  'font-style': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['font-style'] = val;
  },
  'font-family': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['font-family'] = val.replace(/['"]/g, '');
  },
  'line-height': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['line-height'] = parseValue(val);
  },
  'letter-spacing': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['letter-spacing'] = parseValue(val);
  },
  'text-align': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['text-align'] = val;
  },
  'text-transform': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['text-transform'] = val;
  },
  'text-decoration': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['text-decoration'] = val;
  },
  'white-space': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['white-space'] = val;
  },
  'text-wrap': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['text-wrap'] = val;
  },
  'text-shadow': (val, settings) => {
    const parts = val.split(' ');
    if (parts.length >= 3) {
      settings._typography = settings._typography || {};
      settings._typography['text-shadow'] = settings._typography['text-shadow'] || { values: {} };
      settings._typography['text-shadow'].values = {
        offsetX: parseValue(parts[0]),
        offsetY: parseValue(parts[1]),
        blur: parseValue(parts[2])
      }
      settings._typography['text-shadow'].color = parts[3] ? createColorValue(parts[3]) : undefined
    }
  },
  'font-variant': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['font-variation-settings'] = val;
  },
  'word-spacing': (val, settings) => {
    settings._typography = settings._typography || {};
    settings._typography['word-spacing'] = parseValue(val);
  },
  'list-style': (val, settings) => {
    appendCustomCss(settings, settings._cssClass || '%root%', 'list-style', val);
  },
  'list-style-type': (val, settings) => {
    appendCustomCss(settings, settings._cssClass || '%root%', 'list-style-type', val);
  },
  'list-style-position': (val, settings) => {
    appendCustomCss(settings, settings._cssClass || '%root%', 'list-style-position', val);
  },
  'list-style-image': (val, settings) => {
    appendCustomCss(settings, settings._cssClass || '%root%', 'list-style-image', val);
  }
};

// Export individual mappers for direct import
export const colorMapper = typographyMappers['color'];
export const fontSizeMapper = typographyMappers['font-size'];
export const fontWeightMapper = typographyMappers['font-weight'];
export const fontStyleMapper = typographyMappers['font-style'];
export const fontFamilyMapper = typographyMappers['font-family'];
export const lineHeightMapper = typographyMappers['line-height'];
export const letterSpacingMapper = typographyMappers['letter-spacing'];
export const textAlignMapper = typographyMappers['text-align'];
export const textTransformMapper = typographyMappers['text-transform'];
export const textDecorationMapper = typographyMappers['text-decoration'];
export const whiteSpaceMapper = typographyMappers['white-space'];
export const textWrapMapper = typographyMappers['text-wrap'];
export const textShadowMapper = typographyMappers['text-shadow'];
