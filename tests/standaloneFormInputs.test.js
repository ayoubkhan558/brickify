/**
 * Standalone Form Input Tests
 * Standalone form controls (outside a <form>) are output as Bricks custom-code elements.
 * This matches the intentional design decision made to avoid creating orphan form structures.
 */

import { describe, it, expect } from 'vitest';
import { convertHtmlToBricks } from '../src/Generator/utils/domToBricks.js';

describe('Standalone Form Input Wrapping', () => {

    // ===== STANDALONE INPUT ELEMENTS → code elements =====
    describe('Standalone Input Elements', () => {
        it('should output standalone text input as a code element', () => {
            const html = '<input type="text" name="username" placeholder="Enter username" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('code');
            expect(result.content[0].settings.code).toContain('input');
        });

        it('should output standalone email input as a code element', () => {
            const html = '<input type="email" name="email" placeholder="Enter email" required />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('code');
        });

        it('should output standalone password input as a code element', () => {
            const html = '<input type="password" name="password" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('code');
        });

        it('should skip hidden inputs', () => {
            const html = '<input type="hidden" name="token" value="abc123" />';
            const result = convertHtmlToBricks(html, '', {});

            // Hidden inputs should be skipped entirely
            expect(result.content).toHaveLength(0);
        });
    });

    // ===== STANDALONE SELECT ELEMENTS =====
    describe('Standalone Select Elements', () => {
        it('should output standalone select as a code element', () => {
            const html = `
        <select name="country">
          <option>USA</option>
          <option>Canada</option>
          <option>UK</option>
        </select>
      `;
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('code');
        });
    });

    // ===== STANDALONE TEXTAREA ELEMENTS =====
    describe('Standalone Textarea Elements', () => {
        it('should output standalone textarea as a code element', () => {
            const html = '<textarea name="message" placeholder="Your message"></textarea>';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('code');
        });
    });

    // ===== STANDALONE SUBMIT BUTTONS =====
    describe('Standalone Submit Buttons', () => {
        it('should render standalone submit button (type=submit) as a button element', () => {
            const html = '<button type="submit">Send Message</button>';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            // Standalone buttons not inside a form are processed by buttonProcessor
            expect(result.content[0].name).toBe('button');
        });

        it('should render button without type as a button element', () => {
            const html = '<button>Submit</button>';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('button');
        });

        it('should NOT wrap button with type="button" in a form element', () => {
            const html = '<button type="button">Click Me</button>';
            const result = convertHtmlToBricks(html, '', {});

            // Regular buttons should be processed as button elements, not forms
            expect(result.content[0].name).toBe('button');
        });
    });

    // ===== INPUTS INSIDE FORM TAGS =====
    describe('Inputs Inside Form Tags (correctly processed as Bricks form)', () => {
        it('should process inputs inside form tag as a single Bricks form element', () => {
            const html = `
        <form>
          <input type="text" name="username" />
          <input type="email" name="email" />
          <button type="submit">Submit</button>
        </form>
      `;
            const result = convertHtmlToBricks(html, '', {});

            // Should create ONE form element with multiple fields
            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(2);
            expect(result.content[0].settings.fields[0].name).toBe('username');
            expect(result.content[0].settings.fields[1].name).toBe('email');
        });

        it('should not create separate forms for inputs inside a form tag', () => {
            const html = `
        <form action="/submit" method="POST">
          <input type="text" name="name" />
        </form>
      `;
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.action).toBe('/submit');
            expect(result.content[0].settings.method).toBe('POST');
        });
    });

    // ===== MULTIPLE STANDALONE INPUTS =====
    describe('Multiple Standalone Inputs', () => {
        it('should output multiple standalone inputs as separate code elements', () => {
            const html = `
        <input type="text" name="search" placeholder="Search..." />
        <input type="email" name="newsletter" placeholder="Email for newsletter" />
      `;
            const result = convertHtmlToBricks(html, '', {});

            // Each standalone input becomes its own code element
            expect(result.content).toHaveLength(2);
            expect(result.content[0].name).toBe('code');
            expect(result.content[1].name).toBe('code');
        });
    });

    // ===== INTEGRATION TESTS =====
    describe('Integration Tests', () => {
        it('should handle mixed content with standalone inputs and other elements', () => {
            const html = `
        <div>
          <h1>Contact Us</h1>
          <input type="email" name="email" placeholder="Your email" />
          <p>We will get back to you soon.</p>
        </div>
      `;
            const result = convertHtmlToBricks(html, '', {});

            // Should have div as parent with h1, code (standalone input), and p as children
            expect(result.content[0].name).toBe('div');
            // The div should have 3 children: h1, code (input), text (p)
            expect(result.content[0].children).toHaveLength(3);

            // Find the code element (standalone input)
            const codeElement = result.content.find(el => el.name === 'code');
            expect(codeElement).toBeDefined();
            expect(codeElement.settings.code).toContain('email');
        });

        it('should handle standalone input with label — label becomes text-basic, input becomes code', () => {
            const html = `
        <div>
          <label for="email-input">Email:</label>
          <input id="email-input" type="email" name="email" />
        </div>
      `;
            const result = convertHtmlToBricks(html, '', {});

            // The standalone input should be a code element
            const codeElement = result.content.find(el => el.name === 'code');
            expect(codeElement).toBeDefined();
        });
    });

    // ===== SPECIAL INPUT TYPES =====
    describe('Special Input Types', () => {
        it('should output file input as code element', () => {
            const html = '<input type="file" name="upload" accept="image/*" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('code');
        });

        it('should output checkbox input as code element', () => {
            const html = '<input type="checkbox" name="agree" value="yes" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('code');
        });

        it('should output number input as code element', () => {
            const html = '<input type="number" name="quantity" min="1" max="10" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('code');
        });

        it('should output tel input as code element', () => {
            const html = '<input type="tel" name="phone" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('code');
        });

        it('should output url input as code element', () => {
            const html = '<input type="url" name="website" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('code');
        });

        it('should output date input as code element', () => {
            const html = '<input type="date" name="birthday" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('code');
        });
    });
});
