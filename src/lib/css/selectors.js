import logger from '@lib/logger';
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
            isComplex: /(>|\+|~|\[|\]|:)/.test(selector)       // Any complex selector
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
        } catch {
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
