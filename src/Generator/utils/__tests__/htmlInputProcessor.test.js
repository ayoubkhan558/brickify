/**
 * Unit tests for htmlInputProcessor.js
 * Run with: node src/Generator/utils/__tests__/htmlInputProcessor.test.js
 */

// Inline the module for Node (no bundler available in bare Node)
// We re-implement the function here to test the same logic without ESM issues.

// ── copy of stripAndExtract (kept in sync manually) ───────────────────────────
function stripAndExtract(html) {
  if (!html || typeof html !== 'string') {
    return { bodyContent: html || '', extractedCss: '', extractedJs: '' };
  }

  let processed = html.trim();
  let extractedCss = '';
  let extractedJs = '';

  try {
    // 1. Remove <!DOCTYPE …>
    processed = processed.replace(/<!DOCTYPE[^>]*>/gi, '');

    // 2. Extract inline <script> content (no src attribute), then remove all <script> tags
    const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    processed = processed.replace(scriptRegex, (match, attrs, content) => {
      if (!/\bsrc\s*=/i.test(attrs)) {
        const js = content.trim();
        if (js) {
          extractedJs += (extractedJs ? '\n\n' : '') + js;
        }
      }
      return '';
    });

    // 3. Extract <style> content, then remove all <style> tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    processed = processed.replace(styleRegex, (match, content) => {
      const css = content.trim();
      if (css) {
        extractedCss += (extractedCss ? '\n\n' : '') + css;
      }
      return '';
    });

    // 4. Remove entire <head>…</head> section
    processed = processed.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');

    // 5. Strip wrapper tags
    processed = processed.replace(/<html[^>]*>/gi, '');
    processed = processed.replace(/<\/html>/gi, '');
    processed = processed.replace(/<body[^>]*>/gi, '');
    processed = processed.replace(/<\/body>/gi, '');

    // 6. Collapse blank lines
    processed = processed.replace(/^\s*\n/gm, '').trim();

  } catch {
    return { bodyContent: html, extractedCss: '', extractedJs: '' };
  }

  return { bodyContent: processed, extractedCss, extractedJs };
}
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, actual, expected) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function group(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

// ── TESTS ────────────────────────────────────────────────────────────────────

group('Edge cases – empty / null / non-string input', () => {
  const r1 = stripAndExtract('');
  assert('Empty string → bodyContent empty', r1.bodyContent === '', r1.bodyContent, '');
  assert('Empty string → no CSS', r1.extractedCss === '', r1.extractedCss, '');
  assert('Empty string → no JS', r1.extractedJs === '', r1.extractedJs, '');

  const r2 = stripAndExtract(null);
  assert('null → bodyContent empty string', r2.bodyContent === '', r2.bodyContent, '');

  const r3 = stripAndExtract(undefined);
  assert('undefined → bodyContent empty string', r3.bodyContent === '', r3.bodyContent, '');
});

group('DOCTYPE removal', () => {
  const r = stripAndExtract('<!DOCTYPE html>\n<p>hello</p>');
  assert('DOCTYPE removed', !r.bodyContent.includes('DOCTYPE'), r.bodyContent, '');
  assert('Body content preserved', r.bodyContent.trim() === '<p>hello</p>', r.bodyContent, '<p>hello</p>');
});

group('Strip <html> / <body> wrapper tags', () => {
  const r = stripAndExtract(`<!DOCTYPE html>
<html lang="en">
<body>
<section>Content</section>
</body>
</html>`);
  assert('No <html> tag', !/<html/i.test(r.bodyContent), r.bodyContent, '');
  assert('No </html> tag', !/<\/html>/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <body> tag', !/<body/i.test(r.bodyContent), r.bodyContent, '');
  assert('No </body> tag', !/<\/body>/i.test(r.bodyContent), r.bodyContent, '');
  assert('Section preserved', r.bodyContent.includes('<section>Content</section>'), r.bodyContent, '');
});

group('Remove entire <head> section (including meta, title, link)', () => {
  const r = stripAndExtract(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Page</title>
  <link rel="stylesheet" href="style.css">
  <meta name="viewport" content="width=device-width">
</head>
<body>
<main>Main content</main>
</body>
</html>`);
  assert('No <head> tag', !/<head/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <meta> tags', !/<meta/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <title> tag', !/<title/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <link> tag', !/<link/i.test(r.bodyContent), r.bodyContent, '');
  assert('Main content preserved', r.bodyContent.includes('<main>Main content</main>'), r.bodyContent, '');
});

group('Extract <style> → CSS, remove from HTML', () => {
  const input = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; }
    .hero { color: red; }
  </style>
</head>
<body>
<div class="hero">Hello</div>
</body>
</html>`;
  const r = stripAndExtract(input);
  assert('No <style> in bodyContent', !/<style/i.test(r.bodyContent), r.bodyContent, '');
  assert('CSS extracted – body rule', r.extractedCss.includes('body { margin: 0; }'), r.extractedCss, '');
  assert('CSS extracted – .hero rule', r.extractedCss.includes('.hero { color: red; }'), r.extractedCss, '');
  assert('Body content has .hero div', r.bodyContent.includes('<div class="hero">Hello</div>'), r.bodyContent, '');
});

group('Multiple <style> blocks are concatenated', () => {
  const input = `<html><head>
<style>.a { color: blue; }</style>
<style>.b { color: green; }</style>
</head><body><p>Hi</p></body></html>`;
  const r = stripAndExtract(input);
  assert('First style block present', r.extractedCss.includes('.a { color: blue; }'), r.extractedCss, '');
  assert('Second style block present', r.extractedCss.includes('.b { color: green; }'), r.extractedCss, '');
  assert('No <style> in HTML', !/<style/i.test(r.bodyContent), r.bodyContent, '');
});

group('<style> tag in body is also extracted', () => {
  const input = `<html><body>
<div>Content</div>
<style>.footer { color: gray; }</style>
</body></html>`;
  const r = stripAndExtract(input);
  assert('Body style extracted', r.extractedCss.includes('.footer'), r.extractedCss, '');
  assert('No <style> left in HTML', !/<style/i.test(r.bodyContent), r.bodyContent, '');
  assert('Div preserved', r.bodyContent.includes('<div>Content</div>'), r.bodyContent, '');
});

group('Extract inline <script> → JS, remove from HTML', () => {
  const input = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<div id="app"></div>
<script>
document.getElementById('app').textContent = 'Hello';
console.log('ready');
</script>
</body>
</html>`;
  const r = stripAndExtract(input);
  assert('No <script> in bodyContent', !/<script/i.test(r.bodyContent), r.bodyContent, '');
  assert('JS extracted – getElementById', r.extractedJs.includes("document.getElementById"), r.extractedJs, '');
  assert('JS extracted – console.log', r.extractedJs.includes("console.log"), r.extractedJs, '');
  assert('Div preserved', r.bodyContent.includes('<div id="app"></div>'), r.bodyContent, '');
});

group('External <script src="…"> is NOT extracted but IS removed', () => {
  const input = `<html><body>
<p>Page</p>
<script src="https://cdn.example.com/lib.js"></script>
</body></html>`;
  const r = stripAndExtract(input);
  assert('No <script> tag in HTML', !/<script/i.test(r.bodyContent), r.bodyContent, '');
  assert('No JS extracted from external script', r.extractedJs === '', r.extractedJs, '');
});

group('Multiple inline <script> blocks are concatenated', () => {
  const input = `<html><body>
<script>var a = 1;</script>
<script>var b = 2;</script>
</body></html>`;
  const r = stripAndExtract(input);
  assert('First script extracted', r.extractedJs.includes('var a = 1;'), r.extractedJs, '');
  assert('Second script extracted', r.extractedJs.includes('var b = 2;'), r.extractedJs, '');
});

group('Full real-world page', () => {
  const input = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagano Law Footer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <style>
    :root { --primary: #1a1a2e; }
    footer { background: var(--primary); }
  </style>
</head>
<body>
  <footer>
    <div class="footer__inner">
      <p>&copy; 2024 Pagano Law</p>
    </div>
  </footer>
  <script src="https://cdn.example.com/analytics.js"></script>
  <script>
    window.addEventListener('load', () => console.log('Footer ready'));
  </script>
</body>
</html>`;

  const r = stripAndExtract(input);

  assert('No DOCTYPE', !r.bodyContent.includes('DOCTYPE'), r.bodyContent, '');
  assert('No <html>', !/<html/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <head>', !/<head/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <meta>', !/<meta/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <title>', !/<title/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <link>', !/<link/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <body>', !/<body/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <script>', !/<script/i.test(r.bodyContent), r.bodyContent, '');
  assert('No <style>', !/<style/i.test(r.bodyContent), r.bodyContent, '');
  assert('<footer> preserved', r.bodyContent.includes('<footer>'), r.bodyContent, '');
  assert('Footer text preserved', r.bodyContent.includes('Pagano Law'), r.bodyContent, '');
  assert(':root CSS extracted', r.extractedCss.includes(':root'), r.extractedCss, '');
  assert('footer CSS rule extracted', r.extractedCss.includes('footer {'), r.extractedCss, '');
  assert('Inline JS extracted', r.extractedJs.includes("window.addEventListener"), r.extractedJs, '');
  assert('External script NOT in JS', !r.extractedJs.includes('analytics.js'), r.extractedJs, '');
});

group('Input with no structural tags (plain snippet) is unchanged', () => {
  const input = `<section class="hero">
  <h1>Hello World</h1>
  <p>Subtitle text</p>
</section>`;
  const r = stripAndExtract(input);
  assert('bodyContent equals input (trimmed)', r.bodyContent === input.trim(), r.bodyContent, input.trim());
  assert('No CSS extracted', r.extractedCss === '', r.extractedCss, '');
  assert('No JS extracted', r.extractedJs === '', r.extractedJs, '');
});

group('<html> with attributes (lang, class, etc.)', () => {
  const r = stripAndExtract('<html lang="en" class="dark"><body><p>Hi</p></body></html>');
  assert('html with attrs stripped', !/<html/i.test(r.bodyContent), r.bodyContent, '');
  assert('content preserved', r.bodyContent.includes('<p>Hi</p>'), r.bodyContent, '');
});

group('<body> with class attribute', () => {
  const r = stripAndExtract('<html><body class="page dark-mode"><div>Content</div></body></html>');
  assert('body with class stripped', !/<body/i.test(r.bodyContent), r.bodyContent, '');
  assert('div preserved', r.bodyContent.includes('<div>Content</div>'), r.bodyContent, '');
});

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 All tests passed!');
} else {
  console.log('⚠️  Some tests failed — see above for details.');
  globalThis.process?.exit?.(1);
}
