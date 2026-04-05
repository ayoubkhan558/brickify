/**
 * Component Builder Service
 * Converts standard Bricks elements into Bricks Component JSON structure.
 *
 * Transformation: Elements Array -> [Internal Element IDs + Properties Schema + Connections Map] -> Bricks Component JSON
 */

import { generateComponentId } from '@lib/bricks';
import { BRICKS_VERSION, BRICKS_SOURCE, BRICKS_SOURCE_URL } from '@config/constants';

/**
 * Property type detection rules: maps Bricks element names + setting keys
 * to component property types.
 */
const PROPERTY_TYPE_MAP = {
    text: 'text',
    image: 'image',
    link: 'link',
    src: 'image',
    url: 'link',
    href: 'link',
};

/**
 * Elements whose text/content settings should be auto-detected as exposable properties.
 */
const AUTO_DETECT_ELEMENTS = {
    heading: ['text'],
    'text-basic': ['text'],
    'text-link': ['text', 'link'],
    image: ['image'],
    button: ['text', 'link'],
};

export class ComponentBuilder {
    constructor() {
        this.reset();
    }

    /**
     * Resets the builder state for a fresh conversion.
     */
    reset() {
        this.componentId = '';
        this.contentElement = null;
        this.componentDef = null;
        this.idMapping = new Map();        // old element id -> new component id
        this.properties = [];
        this.propertyGroups = [];
        this.manualProperties = [];        // manually mapped property overrides
    }

    /**
     * Main entry point: converts a standard Bricks structure into a component structure.
     *
     * @param {Object}  standardResult  - The standard { content, globalClasses, ... } output
     * @param {Object}  meta            - Component metadata: { category, description, version }
     * @param {Object}  options         - { autoDetect: boolean, manualProperties: [] }
     * @returns {Object} Bricks component JSON
     */
    buildComponent(standardResult, meta = {}, options = {}) {
        this.reset();

        const { content = [], globalClasses = [], globalElements = [] } = standardResult;
        if (!content.length) return standardResult;   // nothing to componentize

        const autoDetect = options.autoDetect !== false;
        this.manualProperties = options.manualProperties || [];

        // 1. Generate the component ID (cid)
        this.componentId = generateComponentId();

        // 2. Re-map all element IDs to Bricks-native 6-char IDs
        this.idMapping = this.buildIdMapping(content);

        // 3. Build internal elements array (with remapped IDs)
        const internalElements = this.buildInternalElements(content);

        // 4. Build properties (auto-detect + manual overrides)
        if (autoDetect) {
            this.autoDetectProperties(internalElements);
        }
        this.applyManualProperties();

        // 5. Build property groups (group related properties, e.g. button text + link)
        this.buildPropertyGroups();

        // 6. Build the outer content element (the component instance)
        const outerElement = this.buildOuterContentElement(content);

        // 7. Assemble the component definition
        const componentDef = this.buildComponentDefinition(internalElements, meta);

        // 8. Return full structure
        return {
            content: [outerElement],
            source: BRICKS_SOURCE,
            sourceUrl: BRICKS_SOURCE_URL,
            version: BRICKS_VERSION,
            components: [componentDef],
            globalClasses: globalClasses || [],
            globalElements: globalElements || [],
        };
    }

    // ─── Internal Methods ───────────────────────────────────────────────

    /**
     * Creates a mapping from original element IDs to new 6-char component IDs.
     * The root element gets the component ID itself.
     */
    buildIdMapping(content) {
        const mapping = new Map();

        // Find the root element(s) - those whose parent is '0' or 0
        const roots = content.filter(el => el.parent === '0' || el.parent === 0);

        // The first root element maps to the component ID
        if (roots.length > 0) {
            mapping.set(roots[0].id, this.componentId);
        }

        // All other elements get their own 6-char IDs
        content.forEach(el => {
            if (!mapping.has(el.id)) {
                mapping.set(el.id, generateComponentId());
            }
        });

        return mapping;
    }

    /**
     * Builds the internal elements array with remapped IDs and parents.
     */
    buildInternalElements(content) {
        return content.map(el => {
            const newId = this.idMapping.get(el.id);
            const newParent = el.parent === '0' || el.parent === 0
                ? 0
                : this.idMapping.get(el.parent) || el.parent;

            const newChildren = (el.children || []).map(childId =>
                this.idMapping.get(childId) || childId
            );

            // Clone settings - keep all settings as defaults within the component definition
            const settings = { ...el.settings };

            // For text-link elements, clean the link URL from content settings
            // (the URL becomes a property override, not a baked-in default)

            const result = {
                id: newId,
                name: el.name,
                parent: newParent,
                children: newChildren,
                settings,
                label: this.formatLabel(el.label || el.name),
            };

            // Preserve _skipTextNodes flag
            if (el._skipTextNodes) {
                result._skipTextNodes = el._skipTextNodes;
            }

            return result;
        });
    }

    /**
     * Auto-detects exposable properties by scanning internal elements.
     */
    autoDetectProperties(internalElements) {
        internalElements.forEach(el => {
            const detectableKeys = AUTO_DETECT_ELEMENTS[el.name];
            if (!detectableKeys) return;

            detectableKeys.forEach(settingKey => {
                const settingValue = el.settings[settingKey];
                if (settingValue === undefined || settingValue === null) return;

                // Skip if already manually mapped
                if (this.manualProperties.some(mp =>
                    mp.elementId === el.id && mp.settingKey === settingKey
                )) return;

                const propertyType = this.resolvePropertyType(settingKey, el.name);
                const label = this.generatePropertyLabel(el, settingKey);
                const defaultValue = this.resolveDefaultValue(settingKey, settingValue);

                const property = {
                    label,
                    type: propertyType,
                    default: defaultValue,
                    id: generateComponentId(),
                    connections: {
                        [el.id]: [settingKey],
                    },
                };

                this.properties.push(property);
            });
        });
    }

    /**
     * Applies manually configured property mappings.
     */
    applyManualProperties() {
        this.manualProperties.forEach(mp => {
            // Check if auto-detect already created this property
            const existing = this.properties.find(p =>
                p.connections && p.connections[mp.elementId]?.includes(mp.settingKey)
            );

            if (existing) {
                // Update the existing auto-detected property with manual overrides
                if (mp.label) existing.label = mp.label;
                if (mp.type) existing.type = mp.type;
                if (mp.default !== undefined) existing.default = mp.default;
                return;
            }

            // Create a new property
            const elementId = mp.elementId;
            const property = {
                label: mp.label || `Property ${this.properties.length + 1}`,
                type: mp.type || 'text',
                default: mp.default ?? '',
                id: generateComponentId(),
                connections: {
                    [elementId]: [mp.settingKey],
                },
            };

            if (mp.group) {
                property.group = mp.group;
            }

            this.properties.push(property);
        });
    }

    /**
     * Groups related properties (e.g., button text + button link).
     * Looks for elements that have multiple connected properties.
     */
    buildPropertyGroups() {
        // Group properties that share a link + text on the same element
        const elementPropertyMap = new Map();

        this.properties.forEach(prop => {
            if (!prop.connections) return;
            Object.keys(prop.connections).forEach(elId => {
                if (!elementPropertyMap.has(elId)) {
                    elementPropertyMap.set(elId, []);
                }
                elementPropertyMap.get(elId).push(prop);
            });
        });

        elementPropertyMap.forEach((props, elId) => {
            if (props.length >= 2) {
                // Check if one is text and one is link
                const hasText = props.some(p => p.type === 'text');
                const hasLink = props.some(p => p.type === 'link');

                if (hasText && hasLink) {
                    const groupId = generateComponentId();
                    const groupLabel = props[0].label.replace(/\s+(Text|Link)$/i, '') || `Group`;

                    props.forEach(p => {
                        p.group = groupId;
                    });

                    this.propertyGroups.push({
                        id: groupId,
                        name: groupLabel,
                    });
                }
            }
        });
    }

    /**
     * Builds the outer content element (the component instance that references the definition via cid).
     */
    buildOuterContentElement(content) {
        // Find root element
        const root = content.find(el => el.parent === '0' || el.parent === 0);
        if (!root) {
            throw new Error('No root element found in content');
        }

        return {
            id: generateComponentId(),
            name: root.name,
            parent: 0,
            children: [],
            settings: {},
            label: this.formatLabel(root.label || root.name),
            cid: this.componentId,
        };
    }

    /**
     * Builds the full component definition object.
     */
    buildComponentDefinition(internalElements, meta = {}) {
        const def = {
            id: this.componentId,
            category: meta.category || '',
            desc: meta.description || '',
            elements: internalElements,
            properties: this.properties,
            _created: Math.floor(Date.now() / 1000),
            _user_id: 1,
            _version: BRICKS_VERSION,
        };

        if (this.propertyGroups.length > 0) {
            def.propertyGroups = this.propertyGroups;
        }

        return def;
    }

    // ─── Utility Methods ────────────────────────────────────────────────

    /**
     * Resolves the property type from a setting key and element name.
     */
    resolvePropertyType(settingKey, elementName) {
        if (settingKey === 'image') return 'image';
        if (settingKey === 'link') return 'link';
        if (settingKey === 'src' && elementName === 'image') return 'image';
        return PROPERTY_TYPE_MAP[settingKey] || 'text';
    }

    /**
     * Resolves the default value for a property.
     * For images, wraps in Bricks image object format.
     * For links, wraps in Bricks link object format.
     */
    resolveDefaultValue(settingKey, settingValue) {
        if (settingKey === 'image') {
            // Already in Bricks image format { url, external, filename }
            if (typeof settingValue === 'object' && settingValue.url) {
                return settingValue;
            }
            // Plain URL string
            return {
                url: String(settingValue),
                external: true,
                filename: this.extractFilename(String(settingValue)),
            };
        }

        if (settingKey === 'link') {
            if (typeof settingValue === 'object') {
                return {
                    type: settingValue.type || 'external',
                    url: settingValue.url || '#',
                };
            }
            return { type: 'external', url: String(settingValue) };
        }

        return settingValue;
    }

    /**
     * Generates a human-readable property label from an element.
     * Uses BEM class name or element name + setting key.
     */
    generatePropertyLabel(element, settingKey) {
        const label = element.label || element.name;

        // Convert BEM class names to readable labels
        // e.g. "card__title" -> "Card Title"
        // e.g. "hero__heading2" -> "Hero Heading2"
        const readable = label
            .replace(/^\./, '')              // remove leading dot
            .replace(/__/g, ' ')             // BEM element separator
            .replace(/--/g, ' ')             // BEM modifier separator
            .replace(/[-_]/g, ' ')           // dashes/underscores to spaces
            .replace(/\b\w/g, c => c.toUpperCase())  // capitalize words
            .trim();

        // For link properties, append the type to distinguish from text
        if (settingKey === 'link') {
            return `${readable} Link`;
        }

        return readable || `Property`;
    }

    /**
     * Formats a label to be Title Case.
     */
    formatLabel(label) {
        if (!label) return '';
        return label
            .replace(/__/g, ' ')
            .replace(/--/g, ' ')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    /**
     * Extracts filename from a URL.
     */
    extractFilename(url) {
        try {
            const pathname = new URL(url).pathname;
            return pathname.split('/').pop() || url;
        } catch {
            return url;
        }
    }
}
