/**
 * CSS Processor Service
 * Handles CSS parsing, variable resolution, and selector matching
 * Now with advanced selector support!
 */

import { buildCssMap, matchCSSSelectors, parseCssDeclarations } from '../../Generator/utils/cssParser.js';
import { AdvancedSelectorMatcher } from '@lib/cssUtils';
import logger from '@lib/logger';

export class CssProcessor {
    constructor() {
        this.cssMap = {};
        this.variables = {};
        this.rootStyles = '';
        this.keyframes = [];
        this.mediaQueries = [];
    }

    /**
     * Parses CSS and builds internal maps
     * @param {string} css - CSS string to parse
     * @returns {Object} CSS context { cssMap, variables, rootStyles, keyframes }
     */
    parse(css) {
        if (!css || !css.trim()) {
            return this.getEmptyContext();
        }

        try {
            const result = buildCssMap(css);

            this.cssMap = result.cssMap || {};
            this.variables = result.variables || {};
            this.rootStyles = result.rootStyles || '';
            this.keyframes = result.keyframes || [];
            this.mediaQueries = result.mediaQueries || [];

            return this.getContext();
        } catch (error) {
            logger.error('CSS parsing error:', error);
            return this.getEmptyContext();
        }
    }

    /**
     * Gets the current CSS context
     * @returns {Object} CSS context
     */
    getContext() {
        return {
            cssMap: this.cssMap,
            variables: this.variables,
            rootStyles: this.rootStyles,
            keyframes: this.keyframes,
            mediaQueries: this.mediaQueries
        };
    }

    /**
     * Gets an empty CSS context
     * @returns {Object} Empty context
     */
    getEmptyContext() {
        return {
            cssMap: {},
            variables: {},
            rootStyles: '',
            keyframes: [],
            mediaQueries: []
        };
    }

    /**
     * Matches CSS selectors for a DOM node (legacy method)
     * @param {Node} node - DOM node
     * @returns {Object} Match result { properties, pseudoSelectors }
     */
    matchSelectors(node) {
        if (!node || !this.cssMap) {
            return { properties: {}, pseudoSelectors: [] };
        }

        return matchCSSSelectors(node, this.cssMap);
    }

    /**
     * Matches CSS selectors using advanced matcher with cascade support
     * @param {Element} element - DOM element
     * @returns {Object} Match result with specificity
     */
    matchSelectorsAdvanced(element) {
        if (!element || !this.cssMap) {
            return {
                matchingSelectors: [],
                appliedProperties: {},
                specificity: 0
            };
        }

        return AdvancedSelectorMatcher.matchWithCascade(element, this.cssMap);
    }

    /**
     * Validates if a selector is supported
     * @param {string} selector - CSS selector
     * @returns {boolean} True if valid
     */
    isSelectorValid(selector) {
        return AdvancedSelectorMatcher.isValidSelector(selector);
    }

    /**
     * Analyzes selector complexity and features
     * @param {string} selector - CSS selector
     * @returns {Object} Feature analysis
     */
    analyzeSelector(selector) {
        return AdvancedSelectorMatcher.analyzeSelector(selector);
    }

    /**
     * Gets CSS variables
     * @returns {Object} CSS variables
     */
    getVariables() {
        return this.variables;
    }

    /**
     * Gets root styles
     * @returns {string} Root styles
     */
    getRootStyles() {
        return this.rootStyles;
    }

    /**
     * Gets keyframes
     * @returns {Array} Keyframes array
     */
    getKeyframes() {
        return this.keyframes;
    }

    /**
     * Parses CSS declarations into Bricks settings
     * @param {Object|string} properties - CSS properties (object or string)
     * @param {string} className - Class name for custom CSS
     * @param {Object} variables - CSS variables map
     * @returns {Object} Parsed Bricks settings
     */
    parseDeclarations(properties, className = '', variables = {}) {
        return parseCssDeclarations(properties, className, variables || this.variables);
    }

    /**
     * Gets media queries
     * @returns {Array} Media queries array
     */
    getMediaQueries() {
        return this.mediaQueries;
    }

    /**
     * Resets the processor state
     */
    reset() {
        this.cssMap = {};
        this.variables = {};
        this.rootStyles = '';
        this.keyframes = [];
        this.mediaQueries = [];
    }
}
