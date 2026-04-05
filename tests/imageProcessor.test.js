/**
 * Image Processor Tests
 * Tests the processImageElement function for handling image attributes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { processImageElement } from '../src/Generator/elementProcessors/imageProcessor.js';

describe('Image Processor', () => {
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

    // ===== BASIC IMAGE PROCESSING =====
    describe('Basic Image Processing', () => {
        it('should process basic image with src and alt', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'https://example.com/image.jpg');
            node.setAttribute('alt', 'Example image');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.name).toBe('image');
            expect(mockElement.settings.src).toBe('https://example.com/image.jpg');
            expect(mockElement.settings.alt).toBe('Example image');
        });

        it('should set image object with url and filename', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'https://example.com/images/photo.jpg');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.image).toBeDefined();
            expect(mockElement.settings.image.url).toBe('https://example.com/images/photo.jpg');
            expect(mockElement.settings.image.external).toBe(true);
            expect(mockElement.settings.image.filename).toBe('photo.jpg');
        });

        it('should handle empty src attribute', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('alt', 'No source');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.src).toBe('');
            expect(mockElement.settings.image.url).toBe('');
            expect(mockElement.settings.image.filename).toBe('image.jpg'); // fallback
        });

        it('should handle empty alt attribute', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.alt).toBe('');
        });
    });

    // ===== WIDTH AND HEIGHT ATTRIBUTES =====
    describe('Width and Height Attributes', () => {
        it('should handle numeric width attribute (pixels)', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('width', '300');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings._width).toBe('300px');
        });

        it('should handle numeric height attribute (pixels)', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('height', '200');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings._height).toBe('200px');
        });

        it('should handle both width and height attributes', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('width', '800');
            node.setAttribute('height', '600');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings._width).toBe('800px');
            expect(mockElement.settings._height).toBe('600px');
        });

        it('should preserve units if already present', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('width', '100%');
            node.setAttribute('height', '50vh');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings._width).toBe('100%');
            expect(mockElement.settings._height).toBe('50vh');
        });

        it('should not set width/height if not present', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings._width).toBeUndefined();
            expect(mockElement.settings._height).toBeUndefined();
        });
    });

    // ===== LAZY LOADING =====
    describe('Lazy Loading (loading attribute)', () => {
        it('should handle loading="lazy"', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('loading', 'lazy');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.loading).toBe('lazy');
        });

        it('should handle loading="eager"', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('loading', 'eager');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.loading).toBe('eager');
        });

        it('should not set loading if not present', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.loading).toBeUndefined();
        });

        it('should ignore invalid loading values', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('loading', 'auto');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.loading).toBeUndefined();
        });
    });

    // ===== RESPONSIVE IMAGES (srcset and sizes) =====
    describe('Responsive Images (srcset and sizes)', () => {
        it('should handle srcset attribute', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('srcset', 'image-320.jpg 320w, image-640.jpg 640w, image-1280.jpg 1280w');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.srcset).toBe('image-320.jpg 320w, image-640.jpg 640w, image-1280.jpg 1280w');
        });

        it('should handle sizes attribute', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('sizes', '(max-width: 600px) 100vw, 50vw');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.sizes).toBe('(max-width: 600px) 100vw, 50vw');
        });

        it('should handle both srcset and sizes together', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'fallback.jpg');
            node.setAttribute('srcset', 'small.jpg 320w, medium.jpg 640w, large.jpg 1280w');
            node.setAttribute('sizes', '(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.srcset).toBe('small.jpg 320w, medium.jpg 640w, large.jpg 1280w');
            expect(mockElement.settings.sizes).toBe('(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px');
        });

        it('should handle srcset with pixel density descriptors', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'image.jpg');
            node.setAttribute('srcset', 'image.jpg 1x, image@2x.jpg 2x, image@3x.jpg 3x');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.srcset).toBe('image.jpg 1x, image@2x.jpg 2x, image@3x.jpg 3x');
        });
    });

    // ===== FILENAME EXTRACTION =====
    describe('Filename Extraction', () => {
        it('should extract filename from path', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', '/assets/images/hero-banner.png');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.image.filename).toBe('hero-banner.png');
        });

        it('should remove query parameters from filename', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'https://cdn.example.com/image.jpg?v=123&size=large');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.image.filename).toBe('image.jpg');
        });

        it('should handle URLs with hash fragments', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'https://example.com/image.webp?w=800#section');

            processImageElement(node, mockElement, 'img');

            // Query param removed, but hash is after filename so it's kept in split
            expect(mockElement.settings.image.filename).toBe('image.webp');
        });
    });

    // ===== EDGE CASES =====
    describe('Edge Cases', () => {
        it('should handle data URI images', () => {
            const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...';
            const node = testDoc.createElement('img');
            node.setAttribute('src', dataUri);

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.src).toBe(dataUri);
            expect(mockElement.settings.image.url).toBe(dataUri);
        });

        it('should handle SVG images', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'icons/logo.svg');
            node.setAttribute('alt', 'Company Logo');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.image.filename).toBe('logo.svg');
        });

        it('should handle WebP images', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'photo.webp');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.image.filename).toBe('photo.webp');
        });

        it('should handle images with no attributes', () => {
            const node = testDoc.createElement('img');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.name).toBe('image');
            expect(mockElement.settings.src).toBe('');
            expect(mockElement.settings.alt).toBe('');
        });
    });

    // ===== REAL-WORLD INTEGRATION TESTS =====
    describe('Real-World Integration Tests', () => {
        it('should handle complete responsive image with all attributes', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'https://cdn.example.com/images/hero.jpg');
            node.setAttribute('alt', 'Hero banner image');
            node.setAttribute('width', '1920');
            node.setAttribute('height', '1080');
            node.setAttribute('loading', 'lazy');
            node.setAttribute('srcset', 'hero-sm.jpg 640w, hero-md.jpg 1280w, hero-lg.jpg 1920w');
            node.setAttribute('sizes', '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.name).toBe('image');
            expect(mockElement.settings.src).toBe('https://cdn.example.com/images/hero.jpg');
            expect(mockElement.settings.alt).toBe('Hero banner image');
            expect(mockElement.settings._width).toBe('1920px');
            expect(mockElement.settings._height).toBe('1080px');
            expect(mockElement.settings.loading).toBe('lazy');
            expect(mockElement.settings.srcset).toBe('hero-sm.jpg 640w, hero-md.jpg 1280w, hero-lg.jpg 1920w');
            expect(mockElement.settings.sizes).toBe('(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw');
        });

        it('should handle thumbnail image', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'thumb.jpg');
            node.setAttribute('alt', 'Product thumbnail');
            node.setAttribute('width', '150');
            node.setAttribute('height', '150');
            node.setAttribute('loading', 'lazy');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings._width).toBe('150px');
            expect(mockElement.settings._height).toBe('150px');
            expect(mockElement.settings.loading).toBe('lazy');
        });

        it('should handle above-the-fold image (eager loading)', () => {
            const node = testDoc.createElement('img');
            node.setAttribute('src', 'logo.png');
            node.setAttribute('alt', 'Site Logo');
            node.setAttribute('width', '200');
            node.setAttribute('height', '50');
            node.setAttribute('loading', 'eager');

            processImageElement(node, mockElement, 'img');

            expect(mockElement.settings.loading).toBe('eager');
        });
    });
});
