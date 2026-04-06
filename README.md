# Brickify - HTML/CSS/JS to Bricks Builder Converter

A powerful web-based tool that converts HTML, CSS, and JavaScript code into Bricks Builder–compatible JSON structure. Designed for Bricks Builder users who want to quickly migrate existing templates or convert AI-generated code into ready-to-use Bricks elements.

## 🚀 Features

### Core Conversion
- **HTML to Bricks** – Converts raw HTML into Bricks Builder's JSON structure with proper element hierarchy.
- **CSS Processing** – Transforms CSS styles into Bricks-compatible format with support for:
  - Typography (font-size, font-weight, color, line-height, etc.)
  - Layout (flexbox, grid, positioning, spacing)
  - Backgrounds (colors, gradients, images)
  - Borders and box-shadows
  - Transforms and transitions
  - Filters and effects
  - Pseudo-classes (:hover, :focus, :active, :visited, :disabled)
  - Pseudo-elements (::before, ::after)
  - **Complex Selectors**:
    - Child selectors (`.parent > .child`)
    - Descendant selectors (`.parent .child`)
    - Sibling selectors (`.item + .item`, `.item ~ .item`)
    - Attribute selectors (`.card[data-type="featured"]`)
    - Compound class selectors (`.btn.primary`)
    - Multiple selectors (`.card, .box`)
- **JavaScript Integration** – Optionally include custom JS as a code element.

### Element Support
- **Structure**: Sections, Containers, Divs
- **Text**: Headings (H1-H6), Paragraphs, Spans, Blockquotes
- **Media**: Images, Videos, Audio, SVG
- **Forms**: Complete form handling with labels, inputs, selects, textareas
  - **Auto-wrapping**: Standalone form inputs automatically wrapped in form elements
- **Navigation**: Nested nav with dropdown support
- **Tables**: Full table structure preservation
- **Lists**: Ordered and unordered lists
- **Links & Buttons**: With proper link settings

### Style Handling Options
| Mode     | Description                                              |
|----------|----------------------------------------------------------|
| **Skip** | Ignores inline styles completely                          |
| **Inline** | Preserves styles as inline attributes                   |
| **Class** | Converts styles to Bricks global classes (recommended)   |

### AI Code Generation
Generate HTML/CSS code using AI providers:
- **Google Gemini** – Fast and free tier available
- **OpenAI** – GPT-4o-mini and other models
- **OpenRouter** – Access to multiple free models

### Output Options
- Toggle minified/pretty-printed JSON
- Copy to clipboard with one click
- Include/exclude JavaScript
- Live preview with real-time updates
- Element structure tree view

### 🧩 Component Mode (Reusable Components)
Create **reusable Bricks components** with configurable properties:
- **Auto-Detection**: Automatically identifies text, images, and links as editable properties
- **Manual Configuration**: Fine-tune which elements become properties
- **Property Types**: text, rich-text, icon, image, link, select, toggle, and more
- **Component Meta**: Add category and description for organization
- **Multiple Components**: Create several components from one HTML structure
- **Resizable Editor**: Adjustable split-panel for component configuration
- **Smart Label Generation**: Auto-generates property labels from parent context

📖 **[Full Component Mode Documentation →](docs/COMPONENT_MODE.md)**

---

## Source Directory (`src/`)

- **App Components**: Core React components such as `App.jsx` and `App.scss`.
- **Generator Module**: Handles the conversion logic (HTML → Bricks JSON) in files like `bricksGenerator.js` and `domToBricks.js`.
- **Element Processors**: Specialized processors for elements like buttons, forms, and images (e.g., `buttonProcessor.js`, `formProcessor.js`).
- **CSS Mappers**: Files like `background.js` and `layout-spacing.js` convert CSS rules to Bricks format.
- **Preview & Structure View**: Real-time UI components for preview and structure tree.
- **Component Mode**: Create reusable Bricks components
  - `components/ComponentMode/`: UI components and custom hooks
  - `services/converter/ComponentBuilder.js`: Core component generation logic
  - **Custom Hooks**: `useElementToRootMapping`, `useDetectedProperties`, `usePropertyHandlers`

### Core Utilities
- **CSS Parser**: Converts CSS into a manageable map for Bricks conversion.
- **DOM Traversal**: Walks the DOM to map elements to Bricks-compatible nodes.
- **JS Processing**: Optionally integrates JS into the Bricks JSON output.
- **Component Builder**: Transforms static elements into reusable components with properties.

---

## AI Integration

Generate code with the help of AI through multiple provider options:
- **Google Gemini**: Fast and free with an API key.
- **OpenRouter**: Free models with no rate limits.
- **OpenAI**: GPT-4o-mini and other models available.

---

## Technology Stack

- **Frontend**: React 19, Vite 6
- **Styling**: Sass, CSS Modules
- **Code Editor**: `@uiw/react-codemirror` for HTML/CSS editing
- **Testing**: Vitest
- **AI Integration**: OpenAI, Google Gemini, OpenRouter APIs

---

## Development & Build Commands

- **Start dev server**: `yarn dev`
- **Build for production**: `yarn build`
- **Preview production**: `yarn preview`
- **Run linter**: `yarn lint`
- **Run tests**: `yarn test`
- **Run tests in watch mode**: `yarn test:watch`

---

## Code Quality Findings

### Areas for Improvement
- **Performance**: Memoize `getCssPropMappers()` and optimize CSS selector matching.
- **Code Cleanup**: Remove unused imports, debug logs, and redundant functions like `convertStylesToClass()`.
- **Architectural Suggestions**:
  - Centralize property mappers.
  - Consider adding TypeScript for better maintainability.
  - Increase unit test coverage.

### Recently Fixed Issues
- **SVG Class Mapping**: Fixed issue where SVG elements didn’t receive correct CSS classes.

---

## Suggested Directory Additions
```cmd
For scalability, consider adding:
src/hooks/ # Custom hooks for state management
src/constants/ # Constants and enums (e.g., CSS modes)
src/types/ # JSDoc or TypeScript definitions
src/fixtures/ # Sample HTML/CSS/JS for testing
tests/ # Unit and integration tests
e2e/ # End-to-end tests
```


## Know Issues

- Media queries are preserved but not converted to Bricks breakpoints.
- Nested elements like sliders/navbars/forms may not convert correctly.
- Some complex CSS selectors are added as custom CSS.
- Some complex JavaScript code is added as custom JS.


## 📋 Usage

- Paste your HTML into the HTML editor tab
  - **Auto-strip feature**: HTML structural tags (`<html>`, `<head>`, `<body>`, `<!DOCTYPE>`) are automatically removed
  - **Auto-extract**: `<style>` tags are automatically moved to the CSS tab
  - **Auto-extract**: Inline `<script>` tags are automatically moved to the JS tab (external scripts with `src` are ignored)
- Add CSS (optional) in the CSS tab
- Add JavaScript (optional) in the JS tab
- Configure output options as needed
- Click Copy to Clipboard
- In Bricks Builder, use Cmd/Ctrl + Shift + V to paste

## ✅ Roadmap

### Completed

- Inline styles to classes conversion
- Bricks inner selector support
- CSS animations and transitions
- Complex CSS selectors (child, descendant, sibling, attribute, compound)
- Pseudo-classes (:hover, :focus, :active, :visited, :disabled)
- Pseudo-elements (::before, ::after)
- SVG element support with classes
- AI code generation integration
- Multiple AI provider support
- Native browser API selector matching (element.matches())
- **Standalone form input auto-wrapping** – Automatically wraps standalone inputs in form elements
- **Auto HTML cleanup** – Automatically strips `<html>`, `<head>`, `<body>` tags and extracts `<style>` and `<script>` content
- **🧩 Component Mode** – Create reusable Bricks components with configurable properties
  - Auto-detection of text, image, and link properties
  - Manual property configuration and editing
  - Component meta (category, description)
  - Multiple component support from single HTML
  - Resizable component editor panel
  - Smart property label generation from parent context
  - ID mapping system for property conversion

### Planned

- Media query to Bricks breakpoints conversion
- Custom element mapping configuration

## 🐛 Known Issues

- Media queries are preserved as custom CSS but not converted to Bricks breakpoints.
- Nested forms may not convert correctly.
- Some very complex JavaScript may need manual adjustment.

### Merge Selectors Option

When **"Merge Selectors"** is enabled:
- Complex selector styles (like `.card[data-type="featured"]`) are merged directly into the element's global class settings.
- This creates cleaner output with styles applied to the class.

When disabled:
- Complex selectors are preserved as `_cssCustom` with the original selector intact.
- This maintains CSS specificity and selector relationships.

## 📄 License

MIT License - see LICENSE file for details.

## 👤 Author

Created by Ayoub Khan

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.