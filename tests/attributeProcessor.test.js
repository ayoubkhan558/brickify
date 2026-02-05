/**
 * Attribute Processor Tests
 * Tests the processAttributes function for handling HTML attributes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processAttributes } from '../src/Generator/elementProcessors/attributeProcessor.js';

describe('Attribute Processor', () => {
    let testDoc;
    let mockElement;

    beforeEach(() => {
        const parser = new DOMParser();
        testDoc = parser.parseFromString('<div></div>', 'text/html');

        // Reset mock element for each test
        mockElement = {
            id: 'test-id',
            name: 'div',
            parent: '0',
            children: [],
            settings: {}
        };
    });

    // ===== BASIC ATTRIBUTE HANDLING =====
    describe('Basic Attribute Handling', () => {
        it('should process simple custom attributes', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-custom', 'value');

            processAttributes(node, mockElement, 'div');

            expect(mockElement.settings._attributes).toBeDefined();
            expect(mockElement.settings._attributes).toHaveLength(1);
            expect(mockElement.settings._attributes[0].name).toBe('data-custom');
            expect(mockElement.settings._attributes[0].value).toBe('value');
            expect(mockElement.settings._attributes[0].id).toBeDefined();
        });

        it('should process multiple custom attributes', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-test', 'test-value');
            node.setAttribute('data-id', '123');
            node.setAttribute('aria-label', 'Test Label');

            processAttributes(node, mockElement, 'div');

            expect(mockElement.settings._attributes).toHaveLength(3);

            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('data-test');
            expect(attrNames).toContain('data-id');
            expect(attrNames).toContain('aria-label');
        });

        it('should handle attributes with empty values', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-empty', '');

            processAttributes(node, mockElement, 'div');

            expect(mockElement.settings._attributes).toHaveLength(1);
            expect(mockElement.settings._attributes[0].value).toBe('');
        });
    });

    // ===== ALWAYS SKIP ATTRIBUTES =====
    describe('Always Skip Attributes', () => {
        it('should skip id attribute from _attributes array', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('id', 'my-id');
            node.setAttribute('data-test', 'value');

            processAttributes(node, mockElement, 'div');

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).not.toContain('id');
            expect(attrNames).toContain('data-test');
        });

        it('should skip class attribute from _attributes array', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('class', 'my-class');
            node.setAttribute('data-test', 'value');

            processAttributes(node, mockElement, 'div');

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).not.toContain('class');
        });

        it('should skip style attribute from _attributes array when not inline mode', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('style', 'color: red;');
            node.setAttribute('data-test', 'value');

            processAttributes(node, mockElement, 'div', {
                context: { inlineStyleHandling: 'class' }
            });

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).not.toContain('style');
        });
    });

    // ===== TAG-SPECIFIC SKIP ATTRIBUTES =====
    describe('Tag-Specific Skip Attributes', () => {
        it('should skip href for anchor tags', () => {
            const node = testDoc.createElement('a');
            node.setAttribute('href', 'https://example.com');
            node.setAttribute('title', 'Example');

            processAttributes(node, mockElement, 'a');

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).not.toContain('href');
            expect(attrNames).toContain('title');
        });

        it('should skip src and alt for img tags', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('alt', 'Image description');
            node.setAttribute('title', 'Image title');

            processAttributes(node, mockElement, 'img');

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).not.toContain('src');
            expect(attrNames).not.toContain('alt');
            expect(attrNames).toContain('title');
        });

        it('should not skip href for non-anchor tags', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('href', 'https://example.com');

            processAttributes(node, mockElement, 'div');

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).toContain('href');
        });
    });

    // ===== SPECIAL ATTRIBUTE HANDLING =====
    describe('Special Attribute Handling', () => {
        it('should set _cssId when id attribute is present', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('id', 'my-unique-id');

            processAttributes(node, mockElement, 'div');

            expect(mockElement.settings._cssId).toBe('my-unique-id');
        });

        it('should set link settings for anchor tags with href', () => {
            const node = testDoc.createElement('a');
            node.setAttribute('href', 'https://example.com');
            node.setAttribute('target', '_blank');

            processAttributes(node, mockElement, 'a');

            expect(mockElement.settings.link).toBeDefined();
            expect(mockElement.settings.link.type).toBe('external');
            expect(mockElement.settings.link.url).toBe('https://example.com');
        });

        it('should not set link settings for anchor tags without href', () => {
            const node = testDoc.createElement('a');
            node.setAttribute('title', 'No href');

            processAttributes(node, mockElement, 'a');

            expect(mockElement.settings.link).toBeUndefined();
        });
    });

    // ===== INLINE STYLE HANDLING =====
    describe('Inline Style Handling', () => {
        it('should add style as attribute when inlineStyleHandling is "inline"', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('style', 'color: red; font-size: 16px;');

            processAttributes(node, mockElement, 'div', {
                context: { inlineStyleHandling: 'inline' }
            });

            expect(mockElement.settings._attributes).toBeDefined();
            const styleAttr = mockElement.settings._attributes.find(a => a.name === 'style');
            expect(styleAttr).toBeDefined();
            expect(styleAttr.value).toBe('color: red; font-size: 16px;');
        });

        it('should not add style as attribute when inlineStyleHandling is "class"', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('style', 'color: red;');

            processAttributes(node, mockElement, 'div', {
                context: { inlineStyleHandling: 'class' }
            });

            const styleAttr = mockElement.settings._attributes?.find(a => a.name === 'style');
            expect(styleAttr).toBeUndefined();
        });

        it('should not add style as attribute when inlineStyleHandling is "skip"', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('style', 'color: red;');

            processAttributes(node, mockElement, 'div', {
                context: { inlineStyleHandling: 'skip' }
            });

            const styleAttr = mockElement.settings._attributes?.find(a => a.name === 'style');
            expect(styleAttr).toBeUndefined();
        });

        it('should skip empty style attributes', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('style', '   ');

            processAttributes(node, mockElement, 'div', {
                context: { inlineStyleHandling: 'inline' }
            });

            const styleAttr = mockElement.settings._attributes?.find(a => a.name === 'style');
            expect(styleAttr).toBeUndefined();
        });
    });

    // ===== BOOLEAN ATTRIBUTES =====
    describe('Boolean Attribute Normalization', () => {
        it('should normalize boolean attribute with empty value to "true"', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('required', '');

            processAttributes(node, mockElement, 'input');

            const requiredAttr = mockElement.settings._attributes.find(a => a.name === 'required');
            expect(requiredAttr.value).toBe('true');
        });

        it('should normalize boolean attribute with attribute name as value to "true"', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('disabled', 'disabled');

            processAttributes(node, mockElement, 'input');

            const disabledAttr = mockElement.settings._attributes.find(a => a.name === 'disabled');
            expect(disabledAttr.value).toBe('true');
        });

        it('should normalize "true" string to "true"', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('checked', 'true');

            processAttributes(node, mockElement, 'input');

            const checkedAttr = mockElement.settings._attributes.find(a => a.name === 'checked');
            expect(checkedAttr.value).toBe('true');
        });

        it('should normalize "false" string to "false"', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('required', 'false');

            processAttributes(node, mockElement, 'input');

            const requiredAttr = mockElement.settings._attributes.find(a => a.name === 'required');
            expect(requiredAttr.value).toBe('false');
        });

        it('should normalize "1" to "true"', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('autofocus', '1');

            processAttributes(node, mockElement, 'input');

            const autofocusAttr = mockElement.settings._attributes.find(a => a.name === 'autofocus');
            expect(autofocusAttr.value).toBe('true');
        });

        it('should normalize "0" to "false"', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('required', '0');

            processAttributes(node, mockElement, 'input');

            const requiredAttr = mockElement.settings._attributes.find(a => a.name === 'required');
            expect(requiredAttr.value).toBe('false');
        });

        it('should handle multiple boolean attributes', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('required', '');
            node.setAttribute('disabled', 'disabled');
            node.setAttribute('readonly', 'false');

            processAttributes(node, mockElement, 'input');

            expect(mockElement.settings._attributes.find(a => a.name === 'required').value).toBe('true');
            expect(mockElement.settings._attributes.find(a => a.name === 'disabled').value).toBe('true');
            expect(mockElement.settings._attributes.find(a => a.name === 'readonly').value).toBe('false');
        });
    });

    // ===== TARGET ATTRIBUTE NORMALIZATION =====
    describe('Target Attribute Normalization', () => {
        it('should normalize _blank to _blank', () => {
            const node = testDoc.createElement('a');
            node.setAttribute('href', 'https://example.com');
            node.setAttribute('target', '_blank');

            processAttributes(node, mockElement, 'a');

            const targetAttr = mockElement.settings._attributes?.find(a => a.name === 'target');
            if (targetAttr) {
                expect(targetAttr.value).toBe('_blank');
            }
        });

        it('should normalize blank to _blank', () => {
            const node = testDoc.createElement('a');
            node.setAttribute('href', 'https://example.com');
            node.setAttribute('target', 'blank');

            processAttributes(node, mockElement, 'a');

            const targetAttr = mockElement.settings._attributes?.find(a => a.name === 'target');
            if (targetAttr) {
                expect(targetAttr.value).toBe('_blank');
            }
        });
    });

    // ===== DATA-BRICKS ATTRIBUTES =====
    describe('Data-Bricks Attributes', () => {
        it('should skip data-bricks-* attributes', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-bricks-id', '12345');
            node.setAttribute('data-bricks-element', 'div');
            node.setAttribute('data-custom', 'value');

            processAttributes(node, mockElement, 'div');

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).not.toContain('data-bricks-id');
            expect(attrNames).not.toContain('data-bricks-element');
            expect(attrNames).toContain('data-custom');
        });
    });

    // ===== ARIA ATTRIBUTES =====
    describe('ARIA Attributes', () => {
        it('should process aria-* attributes', () => {
            const node = testDoc.createElement('button');
            node.setAttribute('aria-label', 'Close');
            node.setAttribute('aria-expanded', 'false');
            node.setAttribute('aria-hidden', 'true');

            processAttributes(node, mockElement, 'button');

            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('aria-label');
            expect(attrNames).toContain('aria-expanded');
            expect(attrNames).toContain('aria-hidden');
        });
    });

    // ===== DATA ATTRIBUTES =====
    describe('Data Attributes', () => {
        it('should process data-* attributes (except data-bricks-*)', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-id', '123');
            node.setAttribute('data-name', 'test');
            node.setAttribute('data-value', 'abc');

            processAttributes(node, mockElement, 'div');

            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('data-id');
            expect(attrNames).toContain('data-name');
            expect(attrNames).toContain('data-value');
        });
    });

    // ===== SKIP UNKNOWN ATTRIBUTES =====
    describe('Skip Unknown Attributes Option', () => {
        it('should skip unknown attributes when skipUnknownAttributes is true', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('unknown-attr', 'value');
            node.setAttribute('data-test', 'test');

            processAttributes(node, mockElement, 'div', {
                context: { skipUnknownAttributes: true }
            });

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).not.toContain('unknown-attr');
            expect(attrNames).toContain('data-test'); // data-* is known
        });

        it('should include unknown attributes when skipUnknownAttributes is false', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('unknown-attr', 'value');

            processAttributes(node, mockElement, 'div', {
                context: { skipUnknownAttributes: false }
            });

            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).toContain('unknown-attr');
        });

        it('should include global attributes even when skipUnknownAttributes is true', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('title', 'Test Title');
            node.setAttribute('role', 'button');
            node.setAttribute('tabindex', '0');

            processAttributes(node, mockElement, 'div', {
                context: { skipUnknownAttributes: true }
            });

            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('title');
            expect(attrNames).toContain('role');
            expect(attrNames).toContain('tabindex');
        });
    });

    // ===== ATTRIBUTE MERGING =====
    describe('Attribute Merging', () => {
        it('should not overwrite existing attributes', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-test', 'new-value');

            // Pre-populate with existing attribute
            mockElement.settings._attributes = [
                { id: 'existing-id', name: 'data-test', value: 'old-value' }
            ];

            processAttributes(node, mockElement, 'div');

            expect(mockElement.settings._attributes).toHaveLength(1);
            expect(mockElement.settings._attributes[0].value).toBe('old-value');
        });

        it('should add new attributes to existing array', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-new', 'new-value');
            node.setAttribute('data-existing', 'should-not-add');

            mockElement.settings._attributes = [
                { id: 'existing-id', name: 'data-existing', value: 'old-value' }
            ];

            processAttributes(node, mockElement, 'div');

            expect(mockElement.settings._attributes).toHaveLength(2);
            expect(mockElement.settings._attributes.find(a => a.name === 'data-existing').value).toBe('old-value');
            expect(mockElement.settings._attributes.find(a => a.name === 'data-new').value).toBe('new-value');
        });
    });

    // ===== ELEMENT-SPECIFIC ATTRIBUTES =====
    describe('Element-Specific Attributes', () => {
        it('should process form-specific attributes', () => {
            const node = testDoc.createElement('form');
            node.setAttribute('action', '/submit');
            node.setAttribute('method', 'POST');
            node.setAttribute('enctype', 'multipart/form-data');

            processAttributes(node, mockElement, 'form');

            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('action');
            expect(attrNames).toContain('method');
            expect(attrNames).toContain('enctype');
        });

        it('should process input-specific attributes', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('type', 'text');
            node.setAttribute('name', 'username');
            node.setAttribute('placeholder', 'Enter username');
            node.setAttribute('maxlength', '50');

            processAttributes(node, mockElement, 'input');

            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('type');
            expect(attrNames).toContain('name');
            expect(attrNames).toContain('placeholder');
            expect(attrNames).toContain('maxlength');
        });

        it('should process video-specific attributes', () => {
            const node = testDoc.createElement('video');
            node.setAttribute('poster', 'poster.jpg');
            node.setAttribute('preload', 'metadata');
            node.setAttribute('controls', '');

            processAttributes(node, mockElement, 'video');

            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('poster');
            expect(attrNames).toContain('preload');
            expect(attrNames).toContain('controls');
        });
    });

    // ===== EDGE CASES =====
    describe('Edge Cases', () => {
        it('should handle elements with no attributes', () => {
            const node = testDoc.createElement('div');

            processAttributes(node, mockElement, 'div');

            expect(mockElement.settings._attributes).toBeUndefined();
        });

        it('should handle case-insensitive attribute names', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('DATA-TEST', 'value');

            processAttributes(node, mockElement, 'div');

            // Attribute names should be processed (browsers normalize to lowercase)
            expect(mockElement.settings._attributes).toBeDefined();
        });

        it('should generate unique IDs for each attribute', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('data-one', 'value1');
            node.setAttribute('data-two', 'value2');
            node.setAttribute('data-three', 'value3');

            processAttributes(node, mockElement, 'div');

            const ids = mockElement.settings._attributes.map(a => a.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(3);
        });

        it('should preserve attribute name casing from original element', () => {
            const node = testDoc.createElement('div');
            node.setAttribute('viewBox', '0 0 100 100'); // SVG attribute with mixed case

            processAttributes(node, mockElement, 'div');

            // The actual attribute name stored should match what the browser gives us
            const viewBoxAttr = mockElement.settings._attributes?.find(a =>
                a.name.toLowerCase() === 'viewbox'
            );
            expect(viewBoxAttr).toBeDefined();
        });
    });

    // ===== INTEGRATION TESTS =====
    describe('Integration Tests', () => {
        it('should handle complex real-world anchor element', () => {
            const node = testDoc.createElement('a');
            node.setAttribute('href', 'https://example.com');
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
            node.setAttribute('title', 'Example Link');
            node.setAttribute('data-track', 'click');
            node.setAttribute('aria-label', 'Visit Example');

            processAttributes(node, mockElement, 'a');

            // href should be skipped and converted to link settings
            expect(mockElement.settings.link).toBeDefined();

            // Other attributes should be present
            const attrNames = mockElement.settings._attributes?.map(a => a.name) || [];
            expect(attrNames).toContain('rel');
            expect(attrNames).toContain('title');
            expect(attrNames).toContain('data-track');
            expect(attrNames).toContain('aria-label');
            expect(attrNames).not.toContain('href');
        });

        it('should handle complex real-world form input', () => {
            const node = testDoc.createElement('input');
            node.setAttribute('type', 'email');
            node.setAttribute('name', 'user_email');
            node.setAttribute('id', 'email-input');
            node.setAttribute('placeholder', 'Enter your email');
            node.setAttribute('required', '');
            node.setAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$');
            node.setAttribute('aria-describedby', 'email-help');
            node.setAttribute('data-validate', 'email');

            processAttributes(node, mockElement, 'input');

            // ID should be set as _cssId
            expect(mockElement.settings._cssId).toBe('email-input');

            // All other attributes should be present
            const attrNames = mockElement.settings._attributes.map(a => a.name);
            expect(attrNames).toContain('type');
            expect(attrNames).toContain('name');
            expect(attrNames).toContain('placeholder');
            expect(attrNames).toContain('required');
            expect(attrNames).toContain('pattern');
            expect(attrNames).toContain('aria-describedby');
            expect(attrNames).toContain('data-validate');

            // Required should be normalized to 'true'
            expect(mockElement.settings._attributes.find(a => a.name === 'required').value).toBe('true');
        });
    });
});
