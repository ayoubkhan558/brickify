/**
 * DOM Parser Service
 * Handles parsing HTML into DOM structure
 */

export class DomParser {
    /**
     * Parses HTML string into a DOM document
     * @param {string} html - HTML string to parse
     * @returns {Document} Parsed DOM document
     */
    parse(html) {
        if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
            return this.parseInBrowser(html);
        } else {
            return this.parseInNode(html);
        }
    }

    /**
     * Parses HTML in browser environment
     * @param {string} html - HTML string
     * @returns {Document} DOM document
     */
    parseInBrowser(html) {
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    }

    /**
     * Parses HTML in Node.js environment
     * @param {string} html - HTML string
     * @returns {Document} DOM document
     */
    parseInNode(html) {
        const JSDOM = globalThis.require?.('jsdom')?.JSDOM;
        if (!JSDOM) {
            throw new Error('jsdom is not available in this environment');
        }
        const dom = new JSDOM(`<!DOCTYPE html>${html}`);

        // Set global Node if not defined
        if (typeof globalThis.Node === 'undefined') {
            globalThis.Node = dom.window.Node;
        }

        return dom.window.document;
    }

    /**
     * Gets child nodes from document body
     * @param {Document} doc - DOM document
     * @returns {NodeList} Child nodes
     */
    getBodyNodes(doc) {
        return doc.body.childNodes;
    }

    /**
     * Gets child nodes from document head (fallback)
     * @param {Document} doc - DOM document
     * @returns {NodeList} Child nodes
     */
    getHeadNodes(doc) {
        return doc.head.childNodes;
    }

    /**
     * Checks if element is valid for processing
     * @param {Node} node - DOM node
     * @returns {boolean} True if valid
     */
    isValidElement(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const tag = node.tagName.toLowerCase();

        // Skip empty paragraphs and spans
        if (['p', 'span'].includes(tag) &&
            node.textContent.trim() === '' &&
            node.children.length === 0) {
            return false;
        }

        return true;
    }

    /**
     * Checks if node is a text node with content
     * @param {Node} node - DOM node
     * @returns {boolean} True if text node with content
     */
    isTextNode(node) {
        return node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '';
    }
}
