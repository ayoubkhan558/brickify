/**
 * Standalone Form Input Tests
 * Tests automatic form wrapping for standalone form inputs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { convertHtmlToBricks } from '../src/Generator/utils/domToBricks.js';

describe('Standalone Form Input Wrapping', () => {

    // ===== STANDALONE INPUT ELEMENTS =====
    describe('Standalone Input Elements', () => {
        it('should wrap standalone text input in a form element', () => {
            const html = '<input type="text" name="username" placeholder="Enter username" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(1);
            expect(result.content[0].settings.fields[0].type).toBe('text');
            expect(result.content[0].settings.fields[0].name).toBe('username');
            expect(result.content[0].settings.fields[0].placeholder).toBe('Enter username');
        });

        it('should wrap standalone email input in a form element', () => {
            const html = '<input type="email" name="email" placeholder="Enter email" required />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(1);
            expect(result.content[0].settings.fields[0].type).toBe('email');
            expect(result.content[0].settings.fields[0].required).toBe(true);
        });

        it('should wrap standalone password input in a form element', () => {
            const html = '<input type="password" name="password" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('password');
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
        it('should wrap standalone select in a form element', () => {
            const html = `
        <select name="country">
          <option>USA</option>
          <option>Canada</option>
          <option>UK</option>
        </select>
      `;
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(1);
            expect(result.content[0].settings.fields[0].type).toBe('select');
            expect(result.content[0].settings.fields[0].name).toBe('country');
        });
    });

    // ===== STANDALONE TEXTAREA ELEMENTS =====
    describe('Standalone Textarea Elements', () => {
        it('should wrap standalone textarea in a form element', () => {
            const html = '<textarea name="message" placeholder="Your message"></textarea>';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(1);
            expect(result.content[0].settings.fields[0].type).toBe('textarea');
            expect(result.content[0].settings.fields[0].name).toBe('message');
        });
    });

    // ===== STANDALONE SUBMIT BUTTONS =====
    describe('Standalone Submit Buttons', () => {
        it('should wrap standalone submit button in a form element', () => {
            const html = '<button type="submit">Send Message</button>';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(0);
            expect(result.content[0].settings.submitButtonText).toBe('Send Message');
        });

        it('should wrap button without type (defaults to submit) in a form element', () => {
            const html = '<button>Submit</button>';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.submitButtonText).toBe('Submit');
        });

        it('should NOT wrap button with type="button" in a form element', () => {
            const html = '<button type="button">Click Me</button>';
            const result = convertHtmlToBricks(html, '', {});

            // Regular buttons should be processed as button elements, not forms
            expect(result.content[0].name).toBe('button');
        });
    });

    // ===== INPUTS INSIDE FORM TAGS =====
    describe('Inputs Inside Form Tags (should NOT be wrapped)', () => {
        it('should process inputs inside form tag normally', () => {
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
        it('should create separate forms for multiple standalone inputs', () => {
            const html = `
        <input type="text" name="search" placeholder="Search..." />
        <input type="email" name="newsletter" placeholder="Email for newsletter" />
      `;
            const result = convertHtmlToBricks(html, '', {});

            // Each standalone input should get its own form wrapper
            expect(result.content).toHaveLength(2);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(1);
            expect(result.content[0].settings.fields[0].name).toBe('search');

            expect(result.content[1].name).toBe('form');
            expect(result.content[1].settings.fields).toHaveLength(1);
            expect(result.content[1].settings.fields[0].name).toBe('newsletter');
        });
    });

    // ===== FORM SETTINGS =====
    describe('Form Settings for Wrapped Inputs', () => {
        it('should include default form settings', () => {
            const html = '<input type="text" name="test" />';
            const result = convertHtmlToBricks(html, '', {});

            const formSettings = result.content[0].settings;
            expect(formSettings.submitButtonStyle).toBe('primary');
            expect(formSettings.actions).toEqual(['email']);
            expect(formSettings.showLabels).toBe(true);
            expect(formSettings.submitButtonText).toBe('Submit');
            expect(formSettings.successMessage).toBeDefined();
            expect(formSettings.emailErrorMessage).toBeDefined();
        });

        it('should preserve field attributes in wrapped form', () => {
            const html = '<input type="text" name="username" placeholder="Username" required maxlength="50" />';
            const result = convertHtmlToBricks(html, '', {});

            const field = result.content[0].settings.fields[0];
            expect(field.name).toBe('username');
            expect(field.placeholder).toBe('Username');
            expect(field.required).toBe(true);
            expect(field.maxLength).toBe('50');
        });
    });

    // ===== EDGE CASES =====
    describe('Edge Cases', () => {
        it('should handle input with no attributes', () => {
            const html = '<input />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields).toHaveLength(1);
            expect(result.content[0].settings.fields[0].type).toBe('text'); // default type
        });

        it('should handle textarea with content', () => {
            const html = '<textarea name="bio">Default bio text</textarea>';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('textarea');
        });

        it('should handle select with selected option', () => {
            const html = `
        <select name="size">
          <option>Small</option>
          <option selected>Medium</option>
          <option>Large</option>
        </select>
      `;
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('select');
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

            // Should have div as parent with h1, form (wrapped input), and p as children
            expect(result.content[0].name).toBe('div');
            expect(result.content[0].children).toHaveLength(3);

            // Find the form element
            const formElement = result.content.find(el => el.name === 'form');
            expect(formElement).toBeDefined();
            expect(formElement.settings.fields[0].name).toBe('email');
        });

        it('should handle standalone input with label', () => {
            const html = `
        <div>
          <label for="email-input">Email:</label>
          <input id="email-input" type="email" name="email" />
        </div>
      `;
            const result = convertHtmlToBricks(html, '', {});

            // Find the form element
            const formElement = result.content.find(el => el.name === 'form');
            expect(formElement).toBeDefined();
            expect(formElement.settings.fields[0].type).toBe('email');
        });
    });

    // ===== SPECIAL INPUT TYPES =====
    describe('Special Input Types', () => {
        it('should wrap file input in a form', () => {
            const html = '<input type="file" name="upload" accept="image/*" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('file');
        });

        it('should wrap checkbox input in a form', () => {
            const html = '<input type="checkbox" name="agree" value="yes" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('checkbox');
        });

        it('should wrap number input in a form', () => {
            const html = '<input type="number" name="quantity" min="1" max="10" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('number');
            expect(result.content[0].settings.fields[0].min).toBe('1');
            expect(result.content[0].settings.fields[0].max).toBe('10');
        });

        it('should wrap tel input in a form', () => {
            const html = '<input type="tel" name="phone" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('tel');
        });

        it('should wrap url input in a form', () => {
            const html = '<input type="url" name="website" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('url');
        });

        it('should wrap date input in a form', () => {
            const html = '<input type="date" name="birthday" />';
            const result = convertHtmlToBricks(html, '', {});

            expect(result.content[0].name).toBe('form');
            expect(result.content[0].settings.fields[0].type).toBe('date');
        });
    });
});
