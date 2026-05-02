/**
 * Brickify Constants
 * Centralized configuration constants used throughout the application
 */

// Last update date
export const LAST_UPDATE_DATE = '22 April, 2026';

// Bricks Builder version this tool targets
export const BRICKS_VERSION = '2.3.2';

// Source identifier for copied elements
export const BRICKS_SOURCE = 'bricksCopiedElements';
export const BRICKS_SOURCE_URL = 'https://brickify.netlify.app';

// Style handling modes
export const STYLE_MODES = {
    SKIP: 'skip',      // Ignore inline styles
    INLINE: 'inline',  // Keep as inline style attributes
    CLASS: 'class'     // Convert to Bricks global classes
};

// Supported HTML tags for conversion
export const SUPPORTED_TAGS = {
    STRUCTURE: ['div', 'section', 'header', 'footer', 'main', 'aside', 'article', 'nav', 'figure'],
    TEXT: ['p', 'span', 'blockquote', 'address', 'time', 'mark'],
    HEADINGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    LISTS: ['ul', 'ol', 'li', 'dl', 'dt', 'dd'],
    TABLE: ['table', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'],
    FORM: ['form', 'input', 'select', 'textarea', 'button', 'label'],
    MEDIA: ['img', 'video', 'audio', 'svg'],
    MISC: ['a', 'canvas', 'details', 'summary', 'dialog', 'meter', 'progress', 'script', 'br', 'hr', 'wbr'],
    INLINE: ['kbd', 'samp', 'var', 'cite', 'dfn', 'del', 'ins', 'sub', 'sup', 'abbr', 'q']
};

// HTML attribute groups
export const GLOBAL_ATTRIBUTES = [
    'id',
    'class',
    'style',
    'title',
    'role',
    'tabindex',
    'accesskey',
    'contenteditable',
    'contextmenu',
    'dir',
    'draggable',
    'hidden',
    'lang',
    'spellcheck',
    'translate'
];

export const ELEMENT_SPECIFIC_ATTRIBUTES = {
    a: ['href', 'target', 'rel', 'hreflang', 'referrerpolicy', 'ping', 'download', 'media', 'type'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'crossorigin', 'referrerpolicy', 'usemap', 'ismap', 'sizes', 'srcset', 'title', 'longdesc'],
    form: ['action', 'method', 'enctype', 'autocomplete', 'novalidate', 'target', 'name', 'accept-charset'],
    input: ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'checked', 'readonly', 'multiple', 'min', 'max', 'step', 'minlength', 'maxlength', 'pattern', 'size', 'autocomplete', 'form'],
    textarea: ['name', 'rows', 'cols', 'minlength', 'maxlength', 'placeholder', 'required', 'disabled', 'readonly', 'wrap', 'form'],
    select: ['name', 'multiple', 'required', 'disabled', 'size', 'form'],
    option: ['value', 'label', 'selected', 'disabled'],
    button: ['type', 'name', 'value', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget'],
    video: ['src', 'poster', 'preload', 'autoplay', 'loop', 'muted', 'controls', 'crossorigin', 'referrerpolicy', 'playsinline', 'width', 'height'],
    audio: ['src', 'preload', 'autoplay', 'loop', 'muted', 'controls', 'crossorigin'],
    time: ['datetime'],
    abbr: ['title'],
    meter: ['min', 'max', 'low', 'high', 'optimum', 'value'],
    progress: ['value', 'max'],
    th: ['scope', 'colspan', 'rowspan', 'abbr', 'headers'],
    td: ['colspan', 'rowspan', 'headers'],
    col: ['span', 'width'],
    colgroup: ['span']
};

export const BOOLEAN_ATTRIBUTES = [
    'hidden',
    'required',
    'disabled',
    'checked',
    'selected',
    'multiple',
    'readonly',
    'autofocus',
    'autoplay',
    'controls',
    'loop',
    'muted',
    'novalidate',
    'open',
    'reversed',
    'formnovalidate',
    'playsinline',
    'ismap'
];

// Alert/notification class patterns
// NOTE: Keep this list tight — broad terms like 'banner', 'success', 'warning'
// also appear as general CSS class names for styled divs and would incorrectly
// trigger the processAlertElement path (which creates name:'alert' elements
// that Bricks doesn't know how to render). Only use patterns that are
// unambiguously semantic alert containers.
export const ALERT_CLASS_PATTERNS = [
    'alert', 'notification', 'toast', 'msg', 'flash', 'callout'
];

// Container/layout class patterns
export const CONTAINER_CLASS_PATTERNS = [
    'container', 'boxed', 'wrapper', 'content'
];

// Navigation class patterns
export const NAV_CLASS_PATTERNS = [
    'nav', 'menu', 'navigation', 'links', 'navbar',
    'main-nav', 'primary-nav', 'header-nav', 'site-nav',
    'top-nav', 'subnav', 'submenu', 'breadcrumb', 'pagination'
];




// Logging configuration
export const ENABLE_LOGS = import.meta.env.VITE_ENABLE_LOGS === 'true';

