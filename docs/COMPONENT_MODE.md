# Component Mode - Reusable Bricks Components

## Overview

Component Mode allows you to create **reusable Bricks Builder components** from your HTML/CSS code. Instead of generating static elements, you can define properties that make your components dynamic and configurable when used in Bricks Builder.

## 🎯 What is Component Mode?

Component Mode transforms your HTML structure into a **Bricks Component** with:
- **Configurable Properties**: Text, images, links, and more can be edited in Bricks
- **Auto-Detection**: Automatically identifies editable content
- **Manual Configuration**: Fine-tune which elements become properties
- **Reusable Instances**: Use the same component multiple times with different content

## 🚀 Quick Start

### 1. Enable Component Mode
- Toggle on **Component Mode** in the header settings
- The Component Editor panel appears at the bottom of the right panel

### 2. Select Component Roots
- In the **Layers view**, click the component icon (🧩) on elements you want to make into components
- Common choices: cards, sections, heroes, features, testimonials
- Multiple components can be created from one HTML structure

### 3. Configure Properties
Two modes available:

#### Automatic Mode (Default)
- Auto-detects text content, images, and links
- Creates properties automatically
- Best for quick setup

#### Manual Mode
- Click **Manual** to switch
- All auto-detected properties are preserved and become editable
- Add/remove properties as needed
- Edit property labels and types
- Click elements in Layers view to expose/unexpose as properties

### 4. Set Component Meta (Optional)
When components are selected, you can add:
- **Category**: e.g., "Section", "Card", "Hero"
- **Description**: Brief description of the component

### 5. Generate & Use
- The JSON output now includes component definitions
- Copy and paste into Bricks Builder
- Edit properties directly in Bricks interface

## 📋 Component Editor Panel

The Component Editor is located at the bottom of the right panel and is **resizable**. Drag the handle above it to adjust the height.

### Sections

#### Component Meta
*Only visible when at least one component root is selected*

- **Category**: Classify your component (Section, Card, Hero, etc.)
- **Description**: Describe what the component does
- **Reset Button**: Clear all component selections

#### Components Selector
*Only visible when multiple components are selected*

- Shows all selected component roots as clickable chips
- Click to switch between components and view their properties
- Active component shows a green indicator ●
- Components with properties show a diamond indicator ◆

#### Property Detection

**Toggle between modes:**
- **Automatic** 🪄: Auto-detects properties from text, images, links
- **Manual** 👆: Manually configure which elements are properties

**Properties List:**
- Shows all detected/configured properties
- In Manual mode: Edit labels inline, remove properties
- In Automatic mode: Read-only view of auto-detected properties

**Add Property (Manual Mode):**
- Click "+ Add Property"
- Configure:
  - **Label**: Property name shown in Bricks
  - **Type**: text, rich-text, icon, image, link, select, toggle, etc.
  - **Default Value**: Initial value
  - **Element ID**: Target element (advanced)
  - **Setting Key**: Which setting to control (text, image, link, etc.)

## 🏗️ Architecture

### File Structure

```
src/
├── components/
│   └── ComponentMode/
│       ├── index.jsx              # Main component UI
│       ├── ComponentMode.scss     # Styles
│       └── PropertyConfigurator.jsx  # Add property form
├── services/
│   └── converter/
│       ├── ComponentBuilder.js    # Core component generation logic
│       └── ConverterService.js    # Orchestrates conversion
├── contexts/
│   └── GeneratorContext.jsx       # State management
└── Generator/
    └── components/
        ├── GeneratorComponent.jsx # Main generator with resizable panels
        └── StructureView.jsx      # Layers view with component selectors
```

### Key Components

#### ComponentBuilder.js
Core logic for building Bricks components:
- **ID Mapping**: Maps original element IDs to component-internal IDs
- **Auto-Detection**: Identifies text, images, links as properties
- **Manual Properties**: Applies user-defined property configurations
- **Property Groups**: Groups related properties (text + link = button)
- **Component Definition**: Creates the final component structure

#### ComponentMode/index.jsx
UI for component configuration:
- **State Management**: Handles meta, properties, root selection
- **Mode Switching**: Converts auto-detected to manual properties
- **ID Mapping**: Uses output mappings to convert between ID systems
- **Property Lists**: Displays and edits properties

#### GeneratorContext.jsx
Centralized state for component mode:
```javascript
componentMode: boolean                    // Is component mode enabled?
componentAutoDetect: boolean              // Auto or manual detection?
componentMeta: { category, description }  // Component metadata
componentManualProperties: Array          // User-defined properties
componentRootIds: Array                   // Selected component root elements
activeComponentRootId: string|null        // Currently focused component
layerElements: Array                      // Raw element tree for UI
```

## 🔧 How It Works

### 1. Component Selection
When you mark elements as component roots:
- The system identifies the element and its children
- These become a self-contained component unit
- Original IDs are preserved for property mapping

### 2. ID Remapping
Components get their own ID space:
```
Original: brx-div-featurecard-root-1
Component: abc123 (6-char ID)
```
- All child elements get new IDs within the component
- A mapping is stored to convert between them
- This mapping is included in the output JSON

### 3. Property Detection

**Auto-Detect identifies:**
- `text-basic` elements → text properties
- `heading` elements → text properties  
- `image` elements → image properties
- Elements with `link` settings → link properties
- Elements with `icon` settings → icon properties

**Property Label Generation:**
1. Uses element's label (e.g., "Feature Card Icon")
2. Falls back to parent label if generic (e.g., parent is "Feature Card")
3. Formats with proper capitalization

### 4. Manual Properties

When you expose an element as a property:
- System determines the setting key (text, image, link, icon)
- Creates a manual property with:
  - Label from element/parent
  - Appropriate type
  - Default value from element settings
  - Element ID and setting key connection

### 5. Property Groups
Related properties are automatically grouped:
- Text + Link on same element → "Button" group
- Makes Bricks UI cleaner and more organized

## 💡 Use Cases

### Example 1: Feature Card Component

**HTML:**
```html
<div class="feature-card">
  <div class="feature-card__icon">🚀</div>
  <h3 class="feature-card__title">Fast Performance</h3>
  <p class="feature-card__desc">Lightning fast load times.</p>
  <a href="#" class="feature-card__link">Learn More</a>
</div>
```

**Component Properties Created:**
- Icon (icon type)
- Title (text type)
- Description (text type)
- Learn More Link (link type)

**In Bricks:**
- Drag component onto canvas
- Edit each property in the component settings panel
- Reuse with different content

### Example 2: Testimonial Section

**Manual Configuration:**
1. Select testimonial container as component root
2. Switch to Manual mode
3. Expose: Author name, Quote text, Avatar image, Company
4. Set property labels: "Author Name", "Quote", "Avatar", "Company"
5. Generate and use in Bricks

## 🎨 Resizable Layout

The right panel has a **vertical split**:
- **Top (70%)**: Layers/JSON view
- **Bottom (30%)**: Component Editor
- **Resizable**: Drag the horizontal divider to adjust

**Limits:**
- Layers: minimum 30%
- Component Editor: 20%-60%

## ⚙️ Advanced Features

### Property Types Supported
- `text`: Plain text content
- `rich-text`: HTML content with formatting
- `icon`: Icon library selections
- `image`: Image uploads/URLs
- `image-gallery`: Multiple images
- `link`: URL and link settings
- `select`: Dropdown options
- `toggle`: Boolean on/off
- `query-loop`: WordPress query settings
- `global-classes`: CSS class selection

### ID Mapping System

The output JSON includes `idMappings` to convert between:
- **Original IDs**: `brx-div-featurecard-root-1`
- **Component IDs**: `abc123`

This enables:
- Switching from auto to manual mode preserves properties
- Correct property-element connections
- Layer view shows original structure

### State Reset on HTML Change

When you paste new HTML:
- `componentRootIds` → cleared
- `componentManualProperties` → cleared
- `activeComponentRootId` → reset to null

This prevents stale properties from previous code.

## 🐛 Troubleshooting

### Properties Not Showing
- Ensure component roots are selected (click 🧩 in Layers)
- Check if Component Mode is enabled
- Verify you're viewing the active component (use component chips)

### Empty Property Labels
- System auto-generates from parent if element label is generic
- In Manual mode, click the label to edit it

### Switching Modes Loses Properties
- This was fixed! Auto-detected properties now convert to manual
- The ID mapping system preserves connections

### Component Meta Not Showing
- Only appears when at least one component root is selected
- Select a component root in the Layers view

## 📝 Best Practices

1. **Start with Auto-Detect**: Let the system identify properties, then refine
2. **Use Semantic Classes**: `.card__title` creates better labels than generic names
3. **Test in Bricks**: Paste and verify properties work as expected
4. **Keep Components Focused**: One logical unit per component (card, section, etc.)
5. **Use Manual Mode for Complex Components**: Fine-tune property types and labels
6. **Set Component Meta**: Helps organize components in Bricks library

## 🔄 Migration from Static to Component

**Before (Static):**
```json
{
  "content": [
    { "id": "brx-div-1", "name": "div", "settings": { "text": "Hello" } }
  ]
}
```

**After (Component):**
```json
{
  "content": [
    { "id": "xyz789", "name": "div", "cid": "abc123" }
  ],
  "components": [
    {
      "id": "abc123",
      "category": "Section",
      "properties": [
        {
          "label": "Heading Text",
          "type": "text",
          "default": "Hello",
          "connections": { "def456": ["text"] }
        }
      ]
    }
  ]
}
```

## 📚 Related Documentation

- [Main README](../README.md) - General Brickify usage
- [Testing Guide](../TESTING.md) - How to test conversions
- [Test Cases](../test-cases.md) - Comprehensive test scenarios

## 🤝 Contributing

When contributing to Component Mode:
1. Keep component logic in `ComponentBuilder.js`
2. UI changes go in `components/ComponentMode/`
3. State management in `GeneratorContext.jsx`
4. Test with multiple component roots
5. Verify ID mappings work correctly
6. Update this documentation

---

**Created by**: Ayoub Khan  
**Last Updated**: 2026-04-06
