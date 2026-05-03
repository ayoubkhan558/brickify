/**
 * Pseudo-Selector Tests
 * Tests the pseudo-selector handling in cssParser.js
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePseudoSelector,
  parsePseudoFromSelector,
  mapCssPropertiesToBricksPseudo,
  buildCssMap,
  matchCSSSelectors,
  matchCSSSelectorsPerClass,
} from './../src/Generator/utils/cssParser.js';

describe('normalizePseudoSelector', () => {
  it('should convert :before to ::before', () => {
    expect(normalizePseudoSelector('.foo:before')).toBe('.foo::before');
  });

  it('should convert :after to ::after', () => {
    expect(normalizePseudoSelector('.foo:after')).toBe('.foo::after');
  });

  it('should leave ::before unchanged', () => {
    expect(normalizePseudoSelector('.foo::before')).toBe('.foo::before');
  });

  it('should leave ::after unchanged', () => {
    expect(normalizePseudoSelector('.foo::after')).toBe('.foo::after');
  });

  it('should NOT convert :hover (pseudo-class)', () => {
    expect(normalizePseudoSelector('.foo:hover')).toBe('.foo:hover');
  });

  it('should NOT convert :active (pseudo-class)', () => {
    expect(normalizePseudoSelector('.foo:active')).toBe('.foo:active');
  });

  it('should convert :first-letter to ::first-letter', () => {
    expect(normalizePseudoSelector('.foo:first-letter')).toBe('.foo::first-letter');
  });

  it('should convert :placeholder to ::placeholder', () => {
    expect(normalizePseudoSelector('input:placeholder')).toBe('input::placeholder');
  });
});

describe('parsePseudoFromSelector', () => {
  it('should parse ::before pseudo-element', () => {
    const result = parsePseudoFromSelector('.card::before');
    expect(result.baseSelector).toBe('.card');
    expect(result.pseudo).toBe('::before');
    expect(result.pseudoType).toBe('element');
  });

  it('should parse :before (legacy) as ::before', () => {
    const result = parsePseudoFromSelector('.card:before');
    expect(result.baseSelector).toBe('.card');
    expect(result.pseudo).toBe('::before');
    expect(result.pseudoType).toBe('element');
  });

  it('should parse ::after pseudo-element', () => {
    const result = parsePseudoFromSelector('.card::after');
    expect(result.baseSelector).toBe('.card');
    expect(result.pseudo).toBe('::after');
    expect(result.pseudoType).toBe('element');
  });

  it('should parse :hover pseudo-class', () => {
    const result = parsePseudoFromSelector('.btn:hover');
    expect(result.baseSelector).toBe('.btn');
    expect(result.pseudo).toBe(':hover');
    expect(result.pseudoType).toBe('class');
  });

  it('should parse :active pseudo-class', () => {
    const result = parsePseudoFromSelector('.btn:active');
    expect(result.baseSelector).toBe('.btn');
    expect(result.pseudo).toBe(':active');
    expect(result.pseudoType).toBe('class');
  });

  it('should parse :focus pseudo-class', () => {
    const result = parsePseudoFromSelector('input:focus');
    expect(result.baseSelector).toBe('input');
    expect(result.pseudo).toBe(':focus');
    expect(result.pseudoType).toBe('class');
  });

  it('should return null pseudo for non-pseudo selector', () => {
    const result = parsePseudoFromSelector('.card');
    expect(result.pseudo).toBeNull();
    expect(result.pseudoType).toBeNull();
  });
});

describe('mapCssPropertiesToBricksPseudo', () => {
  describe('::before pseudo-element mapping', () => {
    it('should map content property', () => {
      const result = mapCssPropertiesToBricksPseudo({ content: '"//"' }, '::before');
      expect(result.mapped['_content::before']).toBe('//');
    });

    it('should map color to _typography::before', () => {
      const result = mapCssPropertiesToBricksPseudo({ color: 'red' }, '::before');
      expect(result.mapped['_typography::before']).toEqual({ color: { raw: 'red' } });
    });

    it('should map font-size to _typography::before', () => {
      const result = mapCssPropertiesToBricksPseudo({ 'font-size': '14px' }, '::before');
      expect(result.mapped['_typography::before']).toEqual({ 'font-size': '14px' });
    });

    it('should map background-color to _background::before', () => {
      const result = mapCssPropertiesToBricksPseudo({ 'background-color': 'blue' }, '::before');
      expect(result.mapped['_background::before']).toEqual({ color: { raw: 'blue' } });
    });

    it('should map position to _position::before', () => {
      const result = mapCssPropertiesToBricksPseudo({ position: 'absolute' }, '::before');
      expect(result.mapped['_position::before']).toBe('absolute');
    });

    it('should put unmapped properties in unmapped', () => {
      const result = mapCssPropertiesToBricksPseudo({ inset: '0' }, '::before');
      expect(result.unmapped).toEqual({ inset: '0' });
    });
  });

  describe(':hover pseudo-class mapping', () => {
    it('should map color to _typography:hover', () => {
      const result = mapCssPropertiesToBricksPseudo({ color: 'green' }, ':hover');
      expect(result.mapped['_typography:hover']).toEqual({ color: { raw: 'green' } });
    });

    it('should map background-color to _background:hover', () => {
      const result = mapCssPropertiesToBricksPseudo({ 'background-color': 'yellow' }, ':hover');
      expect(result.mapped['_background:hover']).toEqual({ color: { raw: 'yellow' } });
    });

    it('should map border-color to _border:hover', () => {
      const result = mapCssPropertiesToBricksPseudo({ 'border-color': 'blue' }, ':hover');
      expect(result.mapped['_border:hover']).toEqual({ color: { raw: 'blue' } });
    });

    it('should map opacity to _opacity:hover', () => {
      const result = mapCssPropertiesToBricksPseudo({ opacity: '0.8' }, ':hover');
      expect(result.mapped['_opacity:hover']).toBe('0.8');
    });

    it('should map transform to _transform:hover', () => {
      const result = mapCssPropertiesToBricksPseudo({ transform: 'scale(1.1)' }, ':hover');
      expect(result.mapped['_transform:hover']).toBe('scale(1.1)');
    });
  });

  describe('::after pseudo-element mapping', () => {
    it('should map content + position + background together', () => {
      const props = {
        content: '""',
        position: 'absolute',
        background: 'blue',
        opacity: '0.6',
      };
      const result = mapCssPropertiesToBricksPseudo(props, '::after');
      expect(result.mapped['_content::after']).toBe('');
      expect(result.mapped['_position::after']).toBe('absolute');
      expect(result.mapped['_background::after']).toEqual({ color: { raw: 'blue' } });
      expect(result.mapped['_opacity::after']).toBe('0.6');
    });

    it('should map box-shadow', () => {
      const result = mapCssPropertiesToBricksPseudo(
        { 'box-shadow': 'inset 0 0 40px rgba(0,0,0,0.5)' }, '::after'
      );
      expect(result.mapped['_boxShadow::after']).toBe('inset 0 0 40px rgba(0,0,0,0.5)');
    });

    it('should map border-radius', () => {
      const result = mapCssPropertiesToBricksPseudo(
        { 'border-radius': 'inherit' }, '::after'
      );
      expect(result.mapped['_border::after']).toEqual({ radius: 'inherit' });
    });
  });

  describe('Comprehensive property mapping', () => {
    it('should handle multiple typography properties', () => {
      const result = mapCssPropertiesToBricksPseudo({
        color: 'red',
        'font-size': '14px',
        'font-weight': 'bold',
        'text-align': 'center',
      }, '::before');
      const typo = result.mapped['_typography::before'];
      expect(typo.color).toEqual({ raw: 'red' });
      expect(typo['font-size']).toBe('14px');
      expect(typo['font-weight']).toBe('bold');
      expect(typo['text-align']).toBe('center');
    });

    it('should handle flex properties', () => {
      const result = mapCssPropertiesToBricksPseudo({
        'flex-direction': 'column',
        'align-items': 'center',
        gap: '10px',
      }, ':hover');
      expect(result.mapped['_flexDirection:hover']).toBe('column');
      expect(result.mapped['_alignItems:hover']).toBe('center');
      expect(result.mapped['_gap:hover']).toBe('10px');
    });
  });
});

describe('buildCssMap pseudo normalization', () => {
  it('should normalize :before to ::before in CSS map keys', () => {
    const css = `.custom-heading:before { content: "//"; color: red; }`;
    const { cssMap } = buildCssMap(css);
    expect('.custom-heading::before' in cssMap).toBe(true);
    expect('.custom-heading:before' in cssMap).toBe(false);
  });

  it('should keep ::before as ::before in CSS map keys', () => {
    const css = `.custom-heading::before { content: "//"; color: red; }`;
    const { cssMap } = buildCssMap(css);
    expect('.custom-heading::before' in cssMap).toBe(true);
  });

  it('should normalize :after to ::after in CSS map keys', () => {
    const css = `.custom-heading:after { content: ""; position: absolute; }`;
    const { cssMap } = buildCssMap(css);
    expect('.custom-heading::after' in cssMap).toBe(true);
    expect('.custom-heading:after' in cssMap).toBe(false);
  });

  it('should keep :hover as :hover (not double colon)', () => {
    const css = `.custom-heading:hover { color: green; }`;
    const { cssMap } = buildCssMap(css);
    expect('.custom-heading:hover' in cssMap).toBe(true);
  });
});

describe('matchCSSSelectors with pseudo-selectors', () => {
  function createDoc(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  it('should map ::before properties to native Bricks settings', () => {
    const doc = createDoc('<h1 class="custom-heading">Hello</h1>');
    const element = doc.querySelector('.custom-heading');
    const cssMap = {
      '.custom-heading::before': 'content: "//"; color: red; font-size: 14px',
    };
    const result = matchCSSSelectors(element, cssMap);

    // Should have native pseudo properties in combined properties
    expect(result.properties['_content::before']).toBe('//');
    expect(result.properties['_typography::before']).toEqual({
      color: { raw: 'red' },
      'font-size': '14px',
    });
  });

  it('should map :before (legacy) properties to native Bricks settings', () => {
    const doc = createDoc('<h1 class="custom-heading">Hello</h1>');
    const element = doc.querySelector('.custom-heading');
    const cssMap = {
      '.custom-heading:before': 'content: "//"; color: red',
    };
    const result = matchCSSSelectors(element, cssMap);

    // Should have native pseudo properties - after normalization
    expect(result.properties['_content::before']).toBe('//');
    expect(result.properties['_typography::before']).toEqual({
      color: { raw: 'red' },
    });
  });

  it('should map :hover properties to native Bricks settings', () => {
    const doc = createDoc('<button class="btn">Click</button>');
    const element = doc.querySelector('.btn');
    const cssMap = {
      '.btn:hover': 'color: green; background-color: yellow',
    };
    const result = matchCSSSelectors(element, cssMap);

    expect(result.properties['_typography:hover']).toEqual({
      color: { raw: 'green' },
    });
    expect(result.properties['_background:hover']).toEqual({
      color: { raw: 'yellow' },
    });
  });

  it('should put unmapped pseudo properties in pseudoSelectors', () => {
    const doc = createDoc('<div class="card">Card</div>');
    const element = doc.querySelector('.card');
    const cssMap = {
      '.card::before': 'content: ""; inset: 0; -webkit-text-stroke: 1px red',
    };
    const result = matchCSSSelectors(element, cssMap);

    // content should be mapped
    expect(result.properties['_content::before']).toBe('');

    // inset and -webkit-text-stroke should be in pseudoSelectors as custom CSS
    expect(result.pseudoSelectors.length).toBe(1);
    expect(result.pseudoSelectors[0].properties).toHaveProperty('inset');
    expect(result.pseudoSelectors[0].properties).toHaveProperty('-webkit-text-stroke');
  });

  it('should NOT map pseudo selectors for non-matching elements', () => {
    const doc = createDoc('<div class="other">Other</div>');
    const element = doc.querySelector('.other');
    const cssMap = {
      '.card::before': 'content: "//"; color: red',
    };
    const result = matchCSSSelectors(element, cssMap);

    expect(Object.keys(result.properties).length).toBe(0);
    expect(result.pseudoSelectors.length).toBe(0);
  });
});

describe('matchCSSSelectorsPerClass with pseudo-selectors', () => {
  function createDoc(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  it('should include pseudo metadata in pseudoSelectors', () => {
    const doc = createDoc('<h1 class="custom-heading">Hello</h1>');
    const element = doc.querySelector('.custom-heading');
    const cssMap = {
      '.custom-heading::before': 'content: "//"; color: red',
      '.custom-heading:hover': 'color: green',
    };
    const result = matchCSSSelectorsPerClass(element, cssMap, ['custom-heading']);

    // Should have pseudo selectors with metadata
    expect(result.pseudoSelectors.length).toBe(2);

    const beforeEntry = result.pseudoSelectors.find(p => p.pseudo === '::before');
    expect(beforeEntry).toBeDefined();
    expect(beforeEntry.baseSelector).toBe('.custom-heading');

    const hoverEntry = result.pseudoSelectors.find(p => p.pseudo === ':hover');
    expect(hoverEntry).toBeDefined();
    expect(hoverEntry.baseSelector).toBe('.custom-heading');
  });

  it('should normalize :before to ::before in pseudoSelectors', () => {
    const doc = createDoc('<h1 class="custom-heading">Hello</h1>');
    const element = doc.querySelector('.custom-heading');
    const cssMap = {
      '.custom-heading:before': 'content: "//"; color: red',
    };
    const result = matchCSSSelectorsPerClass(element, cssMap, ['custom-heading']);

    const beforeEntry = result.pseudoSelectors.find(p => p.pseudo === '::before');
    expect(beforeEntry).toBeDefined();
    // Selector should be normalized
    expect(beforeEntry.selector).toBe('.custom-heading::before');
  });
});
