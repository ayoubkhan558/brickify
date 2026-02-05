# Brickify Test Cases & Improvements

## Test Cases - HTML/CSS Examples

### 1. Basic HTML Elements

#### Test Case 1.1: Simple Text Content
```html
<h1>Welcome to Brickify</h1>
<p>This is a simple paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<a href="https://example.com">Click here</a>
```

```css
h1 {
  color: #2c3e50;
  font-size: 32px;
  margin-bottom: 16px;
}

p {
  line-height: 1.6;
  color: #555;
}

strong {
  font-weight: 700;
}
```

**Expected Output**: Should convert headings, paragraphs, and inline elements properly.

---

#### Test Case 1.2: Images and Media
```html
<div class="image-container">
  <img src="https://via.placeholder.com/800x400" alt="Placeholder image" />
  <video controls>
    <source src="video.mp4" type="video/mp4">
  </video>
  <audio controls>
    <source src="audio.mp3" type="audio/mpeg">
  </audio>
</div>
```

```css
.image-container {
  max-width: 800px;
  margin: 0 auto;
}

img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}
```

**Expected Output**: Media elements with proper attributes and styles.

---

### 2. Layout & Structure

#### Test Case 2.1: Flexbox Layout
```html
<div class="flex-container">
  <div class="flex-item">Item 1</div>
  <div class="flex-item">Item 2</div>
  <div class="flex-item">Item 3</div>
</div>
```

```css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background-color: #f5f5f5;
}

.flex-item {
  flex: 1;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

**Expected Output**: Proper flexbox settings in Bricks format.

---

#### Test Case 2.2: CSS Grid Layout
```html
<div class="grid-container">
  <div class="grid-item header">Header</div>
  <div class="grid-item sidebar">Sidebar</div>
  <div class="grid-item main">Main Content</div>
  <div class="grid-item footer">Footer</div>
</div>
```

```css
.grid-container {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-gap: 16px;
  min-height: 100vh;
}

.header {
  grid-column: 1 / -1;
  background: #2c3e50;
  color: white;
  padding: 20px;
}

.sidebar {
  background: #ecf0f1;
  padding: 20px;
}

.main {
  padding: 20px;
}

.footer {
  grid-column: 1 / -1;
  background: #34495e;
  color: white;
  padding: 15px;
}
```

**Expected Output**: Grid layout with proper template columns/rows.

---

### 3. Navigation & Menus

#### Test Case 3.1: Horizontal Navigation
```html
<nav class="navbar">
  <a href="#" class="nav-link active">Home</a>
  <a href="#about" class="nav-link">About</a>
  <a href="#services" class="nav-link">Services</a>
  <a href="#contact" class="nav-link">Contact</a>
</nav>
```

```css
.navbar {
  display: flex;
  background-color: #333;
  padding: 0;
}

.nav-link {
  color: white;
  padding: 14px 20px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #555;
}

.nav-link.active {
  background-color: #04AA6D;
}
```

**Expected Output**: Nav element with hover states.

---

### 4. Forms & Input Elements

#### Test Case 4.1: Contact Form
```html
<form class="contact-form">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required placeholder="Your name">
  
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required placeholder="your@email.com">
  
  <label for="message">Message:</label>
  <textarea id="message" name="message" rows="5" placeholder="Your message here..."></textarea>
  
  <button type="submit">Send Message</button>
</form>
```

```css
.contact-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.contact-form label {
  display: block;
  margin-top: 15px;
  margin-bottom: 5px;
  font-weight: 600;
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.contact-form input:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.contact-form button {
  margin-top: 15px;
  padding: 12px 30px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.contact-form button:hover {
  background-color: #45a049;
}
```

**Expected Output**: Form elements with proper field mappings.

---

### 5. Tables

#### Test Case 5.1: Data Table
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Product</th>
      <th>Price</th>
      <th>Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Widget A</td>
      <td>$19.99</td>
      <td>In Stock</td>
    </tr>
    <tr>
      <td>Widget B</td>
      <td>$29.99</td>
      <td>Out of Stock</td>
    </tr>
  </tbody>
</table>
```

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
}

/* Head */
.data-table thead {
  color: green;
  background: #f3f3f3;
}

.data-table thead th {
  padding: 12px 10px;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid #ccc;
}

/* Body */
.data-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
}

.data-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.data-table tbody td {
  padding: 10px;
}

/* Hover */
.data-table tbody tr:hover {
  background: #f0f0f0;
}

/* Footer */
.data-table tfoot {
  background: #f7f7f7;
}

.data-table tfoot td {
  padding: 12px 10px;
  font-weight: 600;
  border-top: 2px solid #ccc;
}
```

---

### 6. Inline Styles with other attributes

#### Test Case 6.1: Inline Styles with other attributes

```html
<div style="background-color: #f4f4f4; padding: 20px;">
  <h2 style="color: #333; margin-bottom: 10px;">Inline Styled Heading</h2>
  <p style="font-size: 16px; line-height: 1.5;">
    This paragraph uses inline styles for font size and spacing.
  </p>
  <button style="padding: 10px 20px; background: #3498db; color: white; border: 0;">
    Inline Button
  </button>
</div>
```

---

### 7. Complex Selectors

#### Test Case 7.1: Complex Selectors

```html
<div class="card-list">
  <div class="card" data-type="featured">
    <h3>Featured Card</h3>
  </div>
  <div class="card">
    <h3>Regular Card</h3>
  </div>
  <p class="note">Some note here</p>
  <p class="note">Another note</p>
</div>
```

```CSS
/* Direct child selector */
.card-list > .card {
  padding: 20px;
  border: 1px solid #ddd;
}

/* Next sibling selector */
.card + p.note {
  color: #e74c3c;
}

/* Attribute selector */
.card[data-type="featured"] {
  background: #fcf8e3;
  border-color: #f1c40f;
}

/* Multiple selectors */
.card[data-type="featured"], .card.special {
  font-weight: bold;
}
```

---

#### Test Case 7.2: Pseudo-classes and Pseudo-elements
```html
<div class="menu">
  <ul class="menu-list">
    <li class="menu-item active"><a href="#">Home</a></li>
    <li class="menu-item"><a href="#">About</a></li>
    <li class="menu-item has-submenu"><a href="#">Services</a></li>
    <li class="menu-item"><a href="#">Contact</a></li>
  </ul>
  <button class="btn-primary">CTA Button</button>
</div>
```

```css
/* Pseudo-classes */
.menu-item:first-child {
  border-top: none;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

.btn-primary:active {
  transform: translateY(2px);
}

.btn-primary:focus {
  outline: 2px dashed #333;
}

/* Pseudo-elements */
.menu-item.has-submenu::after {
  content: "▼";
  font-size: 10px;
  margin-left: 5px;
}

.btn-primary::before {
  content: "";
  display: inline-block;
  width: 10px;
  height: 10px;
  background: red;
  margin-right: 5px;
}
```

**Expected Output**: Pseudo-classes mapped to states, pseudo-elements handled (likely as custom CSS or specific Bricks settings if supported).

---

#### Test Case 7.3: Compound and Multiple Selectors
```html
<div class="alert alert-success">Success Message</div>
<div class="alert alert-warning">Warning Message</div>
<div class="alert alert-error">Error Message</div>
<div class="status-icon success"></div>
```

```css
/* Compound Selectors */
.alert.alert-success {
  background-color: #d4edda;
  color: #155724;
}

.alert.alert-warning {
  background-color: #fff3cd;
  color: #856404;
}

/* Multiple Selectors */
.alert.alert-error, .status-icon.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Complex + Compound */
.alert.alert-success > .icon {
  fill: green;
}
```

**Expected Output**: Styles correctly applied to the specific compound classes.

---

### 8. CSS Variables

#### Test Case 8.1: CSS Variables in Selectors
```html
<div class="theme-card">
  <h3>Themed Card</h3>
  <p>This card uses CSS variables.</p>
</div>
```

```css
:root {
  --card-bg: #ffffff;
  --card-padding: 24px;
  --card-shadow: 0 4px 6px rgba(0,0,0,0.1);
  --primary-color: #3498db;
}

.theme-card {
  background-color: var(--card-bg);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  border-left: 4px solid var(--primary-color);
}

.theme-card h3 {
  color: var(--primary-color);
}
```

**Expected Output**: CSS variables preserved and used in values.

---

### 9. Visual Effects & Modern CSS

#### Test Case 9.1: Gradients & Multiple Backgrounds
```html
<div class="gradient-box">
  <div class="overlay">Content</div>
</div>
```

```css
.gradient-box {
  width: 100%;
  height: 300px;
  background-image: linear-gradient(to right, #ff7e5f, #feb47b), url('pattern.png');
  background-size: cover, auto;
  background-blend-mode: overlay;
}
```

#### Test Case 9.2: Backdrop Filters & Glassmorphism
```html
<div class="glass-container">
  <div class="glass-card">
    Glassmorphism Effect
  </div>
</div>
```

```css
.glass-container {
  background: url('bg.jpg');
  padding: 50px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
```

#### Test Case 9.3: Complex Shadows
```html
<button class="neon-btn">Neon Button</button>
```

```css
.neon-btn {
  background: transparent;
  border: 2px solid #0ff;
  color: #0ff;
  box-shadow: 0 0 5px #0ff, 0 0 10px #0ff, inset 0 0 5px #0ff;
}
```

---

### 10. Advanced Layouts

#### Test Case 10.1: Sticky Positioning
```html
<div class="scroll-container">
  <div class="sticky-header">Sticky Header</div>
  <div class="content">Long content...</div>
</div>
```

```css
.scroll-container {
  height: 200px;
  overflow-y: scroll;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-bottom: 2px solid #eee;
}
```

#### Test Case 10.2: CSS Columns (Masonry-like)
```html
<div class="masonry-grid">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3 long text...</div>
  <div class="card">Item 4</div>
</div>
```

```css
.masonry-grid {
  column-count: 3;
  column-gap: 20px;
}

.masonry-grid .card {
  break-inside: avoid-column;
  margin-bottom: 20px;
  background: #f0f0f0;
}
```

#### Test Case 10.3: Aspect Ratio Cards
```html
<div class="card-video">
  <iframe src="..."></iframe>
</div>
```

```css
.card-video {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: black;
}
```

---

### 11. Interactive & Media

#### Test Case 11.1: Scroll Snap Carousel
```html
<div class="carousel">
  <div class="slide">1</div>
  <div class="slide">2</div>
  <div class="slide">3</div>
</div>
```

```css
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
  height: 200px;
  background: #ddd;
}
```

#### Test Case 11.2: Object Fit & Position
```html
<div class="avatar-frame">
  <img src="avatar.jpg" class="avatar-img" />
</div>
```

```css
.avatar-frame {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}
```

#### Test Case 11.3: Details & Summary (Accordion)
```html
<details class="accordion">
  <summary class="accordion-header">Click to Expand</summary>
  <div class="accordion-content">
    <p>Hidden content executed via native HTML element.</p>
  </div>
</details>
```

```css
.accordion {
  border: 1px solid #ccc;
  border-radius: 4px;
}

.accordion-header {
  padding: 10px;
  background: #f9f9f9;
  cursor: pointer;
}

.accordion[open] .accordion-header {
  border-bottom: 1px solid #ccc;
}
```

---

### 12. Animations

#### Test Case 12.1: Keyframe Animations
```html
<div class="spinner"></div>
```

```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

#### Test Case 12.2: Media Queries
```html
<div class="box">Content</div>
```

```css
.box {
  padding: 40px;
  background: lightblue;
  font-size: 24px;
  text-align: center;
}

/* Media query */
@media (max-width: 600px) {
  .box {
    background: lightcoral;
    font-size: 18px;
  }
}
```

---

### 13. CSS Functions & Calculations

#### Test Case 13.1: Mathematical Functions
```html
<div class="fluid-container">
  <div class="fluid-text">Responsive Text</div>
</div>
```

```css
.fluid-container {
  width: min(100% - 20px, 1200px);
  padding: clamp(1rem, 2vw, 3rem);
  margin: 0 auto;
}

.fluid-text {
  font-size: clamp(16px, 4vw, 32px);
  width: calc(100% / 3 - 20px);
}
```

---

### 14. Specificity & Overrides

#### Test Case 14.1: Specificity Conflicts & !important
```html
<div id="content" class="main-content">
  <p class="text" style="color: blue;">Text Content</p>
</div>
```

```css
/* ID has higher specificity */
#content .text {
  color: red;
}

/* Class has lower specificity */
.main-content .text {
  color: green;
}

/* !important override */
.text {
  color: purple !important;
}
```

#### Test Case 14.2: Shorthand vs Longhand
```html
<div class="box-model">Box</div>
```

```css
.box-model {
  /* Longhand */
  border-width: 1px;
  border-style: solid;
  border-color: black;
  
  /* Shorthand override */
  border: 2px dashed red;
  
  /* Partial override */
  border-bottom-color: blue;
}
```

---

### 15. Global Styles & Inheritance

#### Test Case 15.1: Global Reset & Inheritance
```html
<div class="parent">
  <div class="child">Inherited Styles</div>
</div>
```

```css
/* Global Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: sans-serif;
  color: #333;
}

.parent {
  color: #666; /* Should inherit to child */
  border: 1px solid #ccc; /* Should NOT inherit */
}
```

---

### 16. State Selectors

#### Test Case 16.1: Form States
```html
<form>
  <input type="text" disabled value="Disabled Input">
  <input type="checkbox" checked>
  <input type="text" readonly value="Readonly">
  <input type="text" required>
</form>
```

```css
input:disabled {
  background: #eee;
  cursor: not-allowed;
}

input:checked {
  accent-color: blue;
}

input:read-only {
  border-color: #999;
}

input:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

#### Test Case 16.2: Target & Focus Within
```html
<div id="target-div">Target Me</div>
<div class="container">
  <input type="text" placeholder="Focus me">
</div>
```

```css
:target {
  background: yellow;
  border: 2px solid orange;
}

.container:focus-within {
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
}
```

---

### 17. Structural Selectors

#### Test Case 17.1: Nth and Only Child
```html
<ul class="list">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
  <li>Item 4</li>
</ul>
<div class="solo">
  <p>Only Paragraph</p>
</div>
```

```css
li:nth-of-type(odd) {
  background: #f9f9f9;
}

li:nth-of-type(3n) {
  color: blue;
}

p:only-child {
  font-weight: bold;
  color: red;
}
```

---

### 18. Modern Functional Selectors

#### Test Case 18.1: :is() and :where()
```html
<header>
  <h1>Title</h1>
  <p>Subtitle</p>
</header>
<article>
  <h1>Article Title</h1>
  <p>Article Text</p>
</article>
```

```css
/* Matches h1 in both header and article */
:is(header, article) h1 {
  font-size: 2em;
  color: darkblue;
}

/* Zero specificity wrapper */
:where(header, article) p {
  color: #666;
}
```

---

### 19. Pseudo-elements

#### Test Case 19.1: Input Styling
```html
<input type="text" placeholder="Type here...">
<p class="selectable">Select this text</p>
<ul>
  <li>List Item</li>
</ul>
```

```css
::placeholder {
  color: #aaa;
  font-style: italic;
}

::selection {
  background: #ffeb3b;
  color: black;
}

li::marker {
  color: red;
  content: "➤ ";
}
```

---

### 20. Advanced Positioning

#### Test Case 20.1: Absolute & Fixed with Z-Index
```html
<div class="relative-parent">
  <div class="absolute-child">Absolute</div>
  <div class="absolute-child z-top">Top Layer</div>
</div>
<div class="fixed-element">Fixed Bottom Right</div>
```

```css
.relative-parent {
  position: relative;
  height: 200px;
  border: 1px solid #ccc;
  z-index: 1; /* New stacking context */
}

.absolute-child {
  position: absolute;
  top: 10px;
  left: 10px;
  background: red;
  z-index: 5;
}

.z-top {
  top: 20px;
  left: 20px;
  background: blue;
  z-index: 10;
}

.fixed-element {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 10px;
}
```

---

### 21. Typography & Web Fonts

#### Test Case 21.1: Font Face & Weights
```html
<h1 class="font-custom">Custom Font Title</h1>
<p class="font-light">Light Text</p>
<p class="font-black">Heavy Text</p>
```

```css
@font-face {
  font-family: 'MyCustomFont';
  src: url('font.woff2') format('woff2');
  font-weight: normal;
}

@font-face {
  font-family: 'Roboto';
  src: url('roboto.woff2');
  font-weight: 100 900; /* Variable font range */
}

.font-custom {
  font-family: 'MyCustomFont', sans-serif;
}

.font-light {
  font-family: 'Roboto';
  font-weight: 300;
}

.font-black {
  font-family: 'Roboto';
  font-weight: 900;
}
```

---

### 22. Special Elements & Overflow

#### Test Case 22.1: SVG and Iframes
```html
<div class="icon-wrapper">
  <svg class="icon" viewBox="0 0 24 24">
    <path d="M12 2L2 22h20L12 2z" />
  </svg>
</div>
<div class="frame-wrapper">
  <iframe src="about:blank"></iframe>
</div>
```

```css
.icon {
  width: 48px;
  height: 48px;
  fill: currentColor;
  stroke: black;
  stroke-width: 2;
}

.frame-wrapper iframe {
  width: 100%;
  height: 300px;
  border: none;
  overflow: hidden;
}
```

#### Test Case 22.2: Overflow Handling
```html
<div class="overflow-box">
  <p>Very long content that should scroll...</p>
</div>
```

```css
.overflow-box {
  width: 200px;
  height: 100px;
  overflow-x: hidden;
  overflow-y: auto;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

---

### 23. Edge Cases

#### Test Case 23.1: Invalid & Broken CSS
```html
<div class="error-test">Error Handling</div>
```

```css
.error-test {
  color: blue;
  /* Missing semicolon */
  font-size: 20px
  background: red; /* Might be ignored due to above error */
  
  /* Invalid property */
  text-align: middle; /* Invalid value */
  
  /* Broken syntax */
  margin: 10px 20px 30px; /* Missing 4th value? (Valid, optional) */
  padding: ; /* Empty value */
}
```