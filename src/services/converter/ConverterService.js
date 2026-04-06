/**
 * Converter Service
 * Main orchestrator for HTML/CSS/JS to Bricks conversion
 */

import { DomParser } from './DomParser.js';
import { CssProcessor } from './CssProcessor.js';
import { BricksBuilder } from './BricksBuilder.js';
import { ComponentBuilder } from './ComponentBuilder.js';
import { domNodeToBricks } from '@generator/utils/domToBricks';
import { DEFAULT_GENERATOR_SETTINGS } from '@config/defaults';
import { deepMerge } from '@lib/helpers';

export class ConverterService {
    constructor(options = {}) {
        this.domParser = new DomParser();
        this.cssProcessor = new CssProcessor();
        this.bricksBuilder = new BricksBuilder();
        this.componentBuilder = new ComponentBuilder();
        this.options = deepMerge(DEFAULT_GENERATOR_SETTINGS, options);
    }

    /**
     * Converts HTML, CSS, and JS to Bricks structure
     * @param {string} html - HTML string
     * @param {string} css - CSS string (optional)
     * @param {string} js - JavaScript string (optional)
     * @param {Object} options - Conversion options (optional)
     * @returns {Object} Bricks JSON structure
     */
    convert(html, css = '', js = '', options = {}) {
        try {
            // Merge options
            const conversionOptions = deepMerge(this.options, options);

            // Step 1: Parse CSS
            const cssContext = this.cssProcessor.parse(css);

            // Step 2: Parse HTML DOM
            const doc = this.domParser.parse(html);
            const bodyNodes = this.domParser.getBodyNodes(doc);

            // Step 3: Convert DOM to Bricks elements
            const { elements, globalClasses } = this.convertNodes(
                bodyNodes,
                cssContext,
                conversionOptions
            );

            // Step 4: Build final structure
            const result = this.bricksBuilder.build(elements, globalClasses, cssContext);

            // Step 5: Add JavaScript if present
            if (js && js.trim() && conversionOptions.includeJs !== false) {
                const rootElement = result.content.find(el => el.parent === '0');
                const parentId = rootElement ? rootElement.id : '0';
                this.bricksBuilder.addJavaScript(js, parentId);
            }

            const standardResult = this.bricksBuilder.getStructure();

            // Step 6: If component mode, transform into component structure
            if (conversionOptions.componentMode) {
                const componentResult = this.componentBuilder.buildComponent(
                    standardResult,
                    {
                        category: conversionOptions.componentCategory || '',
                        description: conversionOptions.componentDescription || '',
                        version: conversionOptions.componentVersion || '',
                    },
                    {
                        autoDetect: conversionOptions.componentAutoDetect !== false,
                        manualProperties: conversionOptions.componentManualProperties || [],
                        componentRootIds: conversionOptions.componentRootIds || (conversionOptions.componentRootId ? [conversionOptions.componentRootId] : []),
                    }
                );
                componentResult.rawContent = standardResult.content;
                return componentResult;
            }

            return standardResult;
        } catch (error) {
            console.error('Conversion error:', error);
            throw error;
        }
    }

    /**
     * Converts DOM nodes to Bricks elements
     * @param {NodeList} nodeList - DOM nodes
     * @param {Object} cssContext - CSS context
     * @param {Object} options - Conversion options
     * @returns {Object} { elements, globalClasses }
     */
    convertNodes(nodeList, cssContext, options) {
        const elements = [];
        const globalClasses = [];
        const allElements = [];

        Array.from(nodeList).forEach((node, index) => {
            const element = domNodeToBricks(
                node,
                cssContext.cssMap,
                '0',
                globalClasses,
                allElements,
                cssContext.variables,
                {
                    ...options,
                    context: {
                        showNodeClass: options.showNodeClass || false,
                        inlineStyleHandling: options.inlineStyleHandling || 'class',
                        mergeNonClassSelectors: options.mergeNonClassSelectors || false
                    }
                },
                `root-${index}`
            );

            if (element) {
                if (Array.isArray(element)) {
                    elements.push(...element);
                } else {
                    elements.push(element);
                }
            }
        });

        // Add any elements that were processed but not in the main array
        allElements.forEach(el => {
            if (!elements.some(e => e.id === el.id)) {
                elements.push(el);
            }
        });

        return { elements, globalClasses };
    }

    /**
     * Updates conversion options
     * @param {Object} options - New options
     */
    setOptions(options) {
        this.options = deepMerge(this.options, options);
    }

    /**
     * Gets current options
     * @returns {Object} Current options
     */
    getOptions() {
        return { ...this.options };
    }

    /**
     * Resets the converter state
     */
    reset() {
        this.cssProcessor.reset();
        this.bricksBuilder.reset();
    }
}

// Export singleton instance
export const converterService = new ConverterService();
