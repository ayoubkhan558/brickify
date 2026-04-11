/**
 * CSS Utilities
 * Color conversion, value parsing, and advanced selector matching
 */

import { logger } from '@lib/logger';

// Helper function to check if a value is a color
export const isColor = (value) => {
    if (typeof value !== 'string') return false;
    const lowerCaseValue = value.toLowerCase();

    // Explicit color formats
    if (lowerCaseValue.startsWith('#')) return true;
    if (lowerCaseValue.startsWith('rgb')) return true;
    if (lowerCaseValue.startsWith('hsl')) return true;
    if (lowerCaseValue === 'transparent' || lowerCaseValue === 'currentcolor') return true;

    // Exclude known non-color CSS keywords
    const nonColorKeywords = [
        // Background-specific
        'repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round',
        'scroll', 'fixed', 'local',
        'border-box', 'padding-box', 'content-box',
        'cover', 'contain', 'auto',
        'center', 'top', 'bottom', 'left', 'right',
        // Generic CSS keywords
        'inherit', 'initial', 'unset', 'revert', 'none'
    ];

    if (nonColorKeywords.includes(lowerCaseValue)) return false;

    // If it contains url() or gradient(), it's not a simple color
    if (lowerCaseValue.includes('url(') || lowerCaseValue.includes('-gradient(')) return false;

    // If it contains position indicators (/, px, %, em, etc. but not in a color context)
    if (lowerCaseValue.includes('/')) return false;

    // Accept everything else as a potential color name or CSS variable
    return true;
};

/**
 * Create a color value object in the format expected by Bricks
 * Preserves the original color value (names, CSS variables, rgb, hsl, hex)
 * @param {string} value - Color value in any valid CSS format
 * @returns {Object} Color object with raw property
 */
export const createColorValue = (value) => {
    if (!value) return null;
    return { raw: value };
};
/**
 * Convert basic color names to hex; pass through hex values
 */
export function toHex(val) {
    if (!val) return null;

    // Preserve rgb/rgba colors as-is
    if (val.startsWith('rgb')) {
        return val;
    }

    // Handle hex colors
    if (val.startsWith('#')) {
        return val.length === 4 || val.length === 7 ? val : null;
    }

    // Handle named colors
    const namedColors = {
        'powderblue': '#000000',
        'black': '#000000',
        'white': '#ffffff',
        'gray': '#808080',
        'lightgray': '#d3d3d3',
        'darkgray': '#a9a9a9',
        'red': '#ff0000',
        'darkred': '#8b0000',
        'blue': '#0000ff',
        'navy': '#000080',
        'skyblue': '#87ceeb',
        'dodgerblue': '#1e90ff',
        'royalblue': '#4169e1',
        'green': '#008000',
        'lime': '#00ff00',
        'limegreen': '#32cd32',
        'seagreen': '#2e8b57',
        'teal': '#008080',
        'aqua': '#00ffff',
        'cyan': '#00ffff',
        'yellow': '#ffff00',
        'orange': '#ffa500',
        'orangered': '#ff4500',
        'gold': '#ffd700',
        'pink': '#ffc0cb',
        'hotpink': '#ff69b4',
        'purple': '#800080',
        'violet': '#ee82ee',
        'magenta': '#ff00ff',
        'silver': '#c0c0c0',
        'whitesmoke': '#f5f5f5',
        'lightblue': '#add8e6',
        'lightgreen': '#90ee90',
        'lightpink': '#ffb6c1'
    };

    return namedColors[val.toLowerCase()] || null;
}

/**
 * Parse numeric values, removing 'px' unit but keeping other units
 * @param {string} value - CSS value to parse
 * @returns {string|number} Parsed value
 */
export const parseValue = (value) => {
    if (typeof value !== 'string') return value;

    // Handle CSS variables
    if (value.startsWith('var(')) return value;

    // Handle calc() and other CSS functions
    if (value.includes('(')) return value;

    // Handle numbers with units
    const numMatch = value.match(/^(-?\d*\.?\d+)([a-z%]*)$/);
    if (numMatch) {
        const num = numMatch[1];
        const unit = numMatch[2];

        // For px values, we just want the number
        if (unit === 'px') return num;

        // For other units (%, em, rem, deg, etc.), keep the unit
        return value;
    }

    return value;
};

/**
 * Split CSS values while preserving functions like clamp(), calc(), etc.
 * @param {string} value - The CSS value to split
 * @returns {Array} Array of individual values
 */
export const splitCSSValue = (value) => {
    if (!value || typeof value !== 'string') return [];

    const values = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < value.length; i++) {
        const char = value[i];

        if (char === '(') {
            depth++;
            current += char;
        } else if (char === ')') {
            depth--;
            current += char;
        } else if (char === ' ' && depth === 0) {
            // Only split on spaces outside of functions
            if (current.trim()) {
                values.push(current.trim());
                current = '';
            }
        } else {
            current += char;
        }
    }

    // Add the last value
    if (current.trim()) {
        values.push(current.trim());
    }

    return values;
};

/**
 * Advanced CSS Selector Matcher
 * Handles complex CSS selectors using element.matches() API
 */
export class AdvancedSelectorMatcher {
    /**
     * Matches a selector against an element
     * @param {Element} element - DOM element to test
     * @param {string} selector - CSS selector
     * @returns {boolean} True if element matches selector
     */
    static matches(element, selector) {
        if (!element || !selector) return false;

        try {
            // Use native element.matches() for complex selector support
            return element.matches(selector);
        } catch (error) {
            logger.warn(`Invalid selector: ${selector}`, error);
            return false;
        }
    }

    /**
     * Gets all matching selectors for an element from a CSS map
     * @param {Element} element - DOM element
     * @param {Object} cssMap - Map of selectors to properties
     * @returns {Object} { matchingSelectors: [], appliedProperties: {} }
     */
    static getMatchingSelectors(element, cssMap) {
        const matchingSelectors = [];
        const appliedProperties = {};

        Object.entries(cssMap).forEach(([selector, properties]) => {
            if (this.matches(element, selector)) {
                matchingSelectors.push(selector);
                // Merge properties (later selectors override earlier ones)
                Object.assign(appliedProperties, this.parseProperties(properties));
            }
        });

        return { matchingSelectors, appliedProperties };
    }

    /**
     * Parses CSS properties string into object
     * @param {string} propertiesString - CSS properties
     * @returns {Object} Properties object
     */
    static parseProperties(propertiesString) {
        if (typeof propertiesString === 'object') {
            return propertiesString;
        }

        const properties = {};
        const declarations = propertiesString.split(';').filter(decl => decl.trim());

        declarations.forEach(decl => {
            const colonIndex = decl.indexOf(':');
            if (colonIndex > -1) {
                const property = decl.substring(0, colonIndex).trim();
                const value = decl.substring(colonIndex + 1).trim();
                if (property && value) {
                    properties[property] = value;
                }
            }
        });

        return properties;
    }

    /**
     * Calculates CSS specificity of a selector
     * @param {string} selector - CSS selector
     * @returns {number} Specificity score
     */
    static getSpecificity(selector) {
        // Simple specificity calculation
        // ID selectors: 100, Class/attribute selectors: 10, Element selectors: 1

        let specificity = 0;

        // Count IDs
        const idMatches = selector.match(/#[a-z0-9_-]+/gi);
        if (idMatches) specificity += idMatches.length * 100;

        // Count classes, attributes, pseudo-classes
        const classMatches = selector.match(/(\.[a-z0-9_-]+|\[[^\]]+\]|:[a-z-]+(?!\())/gi);
        if (classMatches) specificity += classMatches.length * 10;

        // Count element selectors
        const elementMatches = selector.match(/^[a-z]+|[\s>+~][a-z]+/gi);
        if (elementMatches) specificity += elementMatches.length;

        return specificity;
    }

    /**
     * Sorts selectors by specificity
     * @param {Array} selectors - Array of selector strings
     * @returns {Array} Sorted selectors (least to most specific)
     */
    static sortBySpecificity(selectors) {
        return [...selectors].sort((a, b) => {
            return this.getSpecificity(a) - this.getSpecificity(b);
        });
    }

    /**
     * Tests if selector supports advanced features
     * @param {string} selector - CSS selector
     * @returns {Object} Feature flags
     */
    static analyzeSelector(selector) {
        return {
            hasDescendant: /\s+/.test(selector),        // .parent .child
            hasChild: />/.test(selector),               // .parent > .child
            hasAdjacent: /\+/.test(selector),           // .el1 + .el2
            hasSibling: /~/.test(selector),             // .el1 ~ .el2
            hasAttribute: /\[/.test(selector),          // [attr="value"]
            hasPseudoClass: /:(?!:)/.test(selector),    // :hover, :first-child
            hasPseudoElement: /::/.test(selector),      // ::before, ::after
            hasNot: /:not\(/.test(selector),            // :not(.class)
            hasNthChild: /:nth-child/.test(selector),   // :nth-child(2)
            isComplex: /[>+~\[\]:]/.test(selector)       // Any complex selector
        };
    }

    /**
     * Validates if a selector is supported
     * @param {string} selector - CSS selector
     * @returns {boolean} True if valid and supported
     */
    static isValidSelector(selector) {
        try {
            // Test with a dummy element
            document.createElement('div').matches(selector);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets all elements matching a selector in a document
     * @param {Document|Element} context - Document or element to search within
     * @param {string} selector - CSS selector
     * @returns {Array} Matching elements
     */
    static queryAll(context, selector) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            logger.warn(`Invalid selector for querySelectorAll: ${selector}`, error);
            return [];
        }
    }

    /**
     * Matches selectors with priority (specificity) consideration
     * @param {Element} element - DOM element
     * @param {Object} cssMap - CSS map
     * @returns {Object} Matched properties with correct cascade
     */
    static matchWithCascade(element, cssMap) {
        const matches = [];

        // Collect all matching selectors with their specificity
        Object.entries(cssMap).forEach(([selector, properties]) => {
            if (this.matches(element, selector)) {
                matches.push({
                    selector,
                    properties,
                    specificity: this.getSpecificity(selector)
                });
            }
        });

        // Sort by specificity (lowest first)
        matches.sort((a, b) => a.specificity - b.specificity);

        // Apply properties in order (cascade)
        const finalProperties = {};
        matches.forEach(match => {
            Object.assign(finalProperties, this.parseProperties(match.properties));
        });

        return {
            matchingSelectors: matches.map(m => m.selector),
            appliedProperties: finalProperties,
            specificity: matches.length > 0 ? matches[matches.length - 1].specificity : 0
        };
    }
}
