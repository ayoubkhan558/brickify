/**
 * Brickify Constants
 * Centralized configuration constants used throughout the application
 */

// Last update date
export const LAST_UPDATE_DATE = '5 February, 2026';

// Bricks Builder version this tool targets
export const BRICKS_VERSION = '2.2';

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
    STRUCTURE: ['div', 'section', 'header', 'footer', 'main', 'aside', 'article', 'nav'],
    TEXT: ['p', 'span', 'blockquote', 'address', 'time', 'mark'],
    HEADINGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    LISTS: ['ul', 'ol', 'li'],
    TABLE: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'],
    FORM: ['form', 'input', 'select', 'textarea', 'button', 'label'],
    MEDIA: ['img', 'video', 'audio', 'svg'],
    MISC: ['a', 'canvas', 'details', 'summary', 'dialog', 'meter', 'progress', 'script']
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
    audio: ['src', 'preload', 'autoplay', 'loop', 'muted', 'controls', 'crossorigin']
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
export const ALERT_CLASS_PATTERNS = [
    'alert', 'notification', 'message', 'toast', 'msg', 'flash',
    'banner', 'notice', 'warning', 'error', 'success', 'info',
    'callout', 'hint', 'tip', 'note', 'status'
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

// AI Provider types
export const AI_PROVIDERS = {
    GEMINI: 'gemini',
    OPENAI: 'openai',
    OPENROUTER: 'openrouter'
};

// Logging configuration
export const ENABLE_LOGS = import.meta.env.VITE_ENABLE_LOGS === 'true';

// AI Model identifiers
export const AI_MODELS = {
    GEMINI: {
        FLASH: 'gemini-2.0-flash-exp',
        PRO: 'gemini-1.5-pro'
    },
    OPENAI: {
        GPT4_MINI: 'gpt-4o-mini',
        GPT4: 'gpt-4o'
    },
    OPENROUTER: {
        FREE: 'mistralai/mistral-7b-instruct:free'
    }
};
