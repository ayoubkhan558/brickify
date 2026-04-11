import { processHtmlInput, stripAndExtract } from '../src/Generator/utils/htmlInputProcessor';

describe('HTML Input Processor', () => {
    describe('processHtmlInput', () => {
        it('should strip HTML structural tags', () => {
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
</head>
<body>
    <div>Hello World</div>
</body>
</html>`;

            const result = processHtmlInput(html);
            
            expect(result.bodyContent).toContain('<div>Hello World</div>');
            expect(result.bodyContent).not.toContain('<html');
            expect(result.bodyContent).not.toContain('</html>');
            expect(result.bodyContent).not.toContain('<head');
            expect(result.bodyContent).not.toContain('</head>');
            expect(result.bodyContent).not.toContain('<body');
            expect(result.bodyContent).not.toContain('</body>');
            expect(result.bodyContent).not.toContain('<!DOCTYPE');
        });

        it('should extract CSS from style tags', () => {
            const html = `
<div class="container">
    <h1>Title</h1>
</div>
<style>
.container {
    max-width: 1200px;
    margin: 0 auto;
}
h1 {
    font-size: 2rem;
}
</style>`;

            const result = processHtmlInput(html);
            
            expect(result.bodyContent).toContain('<div class="container">');
            expect(result.bodyContent).not.toContain('<style>');
            expect(result.extractedCss).toContain('.container');
            expect(result.extractedCss).toContain('max-width: 1200px');
            expect(result.extractedCss).toContain('h1');
            expect(result.extractedCss).toContain('font-size: 2rem');
        });

        it('should extract JavaScript from script tags', () => {
            const html = `
<div id="app">
    <button onclick="handleClick()">Click me</button>
</div>
<script>
function handleClick() {
    console.log('Button clicked!');
}
</script>`;

            const result = processHtmlInput(html);
            
            expect(result.bodyContent).toContain('<div id="app">');
            expect(result.bodyContent).not.toContain('<script>');
            expect(result.extractedJs).toContain('function handleClick()');
            expect(result.extractedJs).toContain("console.log('Button clicked!')");
        });

        it('should extract multiple style and script tags', () => {
            const html = `
<style>
body { margin: 0; }
</style>
<div>Content</div>
<script>
console.log('Script 1');
</script>
<style>
.container { padding: 20px; }
</style>
<script>
console.log('Script 2');
</script>`;

            const result = processHtmlInput(html);
            
            expect(result.extractedCss).toContain('body { margin: 0; }');
            expect(result.extractedCss).toContain('.container { padding: 20px; }');
            expect(result.extractedJs).toContain("console.log('Script 1')");
            expect(result.extractedJs).toContain("console.log('Script 2')");
        });

        it('should handle empty or invalid input', () => {
            expect(processHtmlInput('')).toMatchObject({
                bodyContent: '',
                extractedCss: '',
                extractedJs: ''
            });
            
            expect(processHtmlInput(null)).toMatchObject({
                bodyContent: '',
                extractedCss: '',
                extractedJs: ''
            });
        });

        it('should skip script tags with src attribute', () => {
            const html = `
<div>Content</div>
<script src="https://example.com/external.js"></script>
<script>
console.log('Inline script');
</script>`;

            const result = processHtmlInput(html);
            
            expect(result.extractedJs).toContain("console.log('Inline script')");
            expect(result.extractedJs).not.toContain('src="https://example.com/external.js"');
        });

        it('should preserve existing content while extracting', () => {
            const html = `
<!DOCTYPE html>
<html>
<head>
    <style>.header { color: blue; }</style>
</head>
<body>
    <header class="header">My Header</header>
    <script>alert('Hello');</script>
</body>
</html>`;

            const result = processHtmlInput(html);
            
            expect(result.bodyContent).toContain('<header class="header">My Header</header>');
            expect(result.extractedCss).toContain('.header { color: blue; }');
            expect(result.extractedJs).toContain("alert('Hello')");
        });
    });

    describe('stripAndExtract', () => {
        it('should be a convenience wrapper with default options', () => {
            const html = `
<html>
<head>
    <style>body { margin: 0; }</style>
</head>
<body>
    <div>Test</div>
    <script>console.log('test');</script>
</body>
</html>`;

            const result = stripAndExtract(html);
            
            expect(result.bodyContent).toContain('<div>Test</div>');
            expect(result.bodyContent).not.toContain('<html>');
            expect(result.extractedCss).toContain('margin: 0');
            expect(result.extractedJs).toContain("console.log('test')");
        });
    });

    describe('Edge cases', () => {
        it('should handle style tags with attributes', () => {
            const html = `
<style type="text/css" media="screen">
.test { color: red; }
</style>
<div class="test">Test</div>`;

            const result = processHtmlInput(html);
            
            expect(result.extractedCss).toContain('.test { color: red; }');
            expect(result.bodyContent).toContain('<div class="test">Test</div>');
        });

        it('should handle script tags with attributes', () => {
            const html = `
<script type="text/javascript" defer>
console.log('Deferred script');
</script>
<div>Content</div>`;

            const result = processHtmlInput(html);
            
            expect(result.extractedJs).toContain("console.log('Deferred script')");
            expect(result.bodyContent).toContain('<div>Content</div>');
        });

        it('should handle nested quotes in attributes', () => {
            const html = `<div style="content: 'quoted text'">Test</div>
<style>
div { content: "another quote"; }
</style>`;

            const result = processHtmlInput(html);
            
            expect(result.bodyContent).toContain("content: 'quoted text'");
            expect(result.extractedCss).toContain('content: "another quote"');
        });

        it('should clean up excessive whitespace', () => {
            const html = `


<!DOCTYPE html>


<html>


<head>


</head>


<body>


<div>Test</div>


</body>


</html>


`;

            const result = processHtmlInput(html);
            
            expect(result.bodyContent).toContain('<div>Test</div>');
            expect(result.bodyContent.trim().startsWith('<div>')).toBe(true);
        });
    });
});
