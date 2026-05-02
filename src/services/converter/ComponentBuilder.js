/**
 * Component Builder Service
 * Converts standard Bricks elements into Bricks Component JSON structure.
 *
 * Transformation: Elements Array -> [Internal Element IDs + Properties Schema + Connections Map] -> Bricks Component JSON
 */

import { generateComponentId } from '@lib/bricks';
import { BRICKS_VERSION, BRICKS_SOURCE, BRICKS_SOURCE_URL } from '@config/constants';

/**
 * Elements whose text/content settings should be auto-detected as exposable properties.
 */
const AUTO_DETECT_ELEMENTS = {
    heading:     ['text'],
    'text-basic':['text'],
    'text-link': ['text', 'link'],
    image:       ['image'],
    button:      ['text', 'link'],
    icon:        ['icon'],
};

export class ComponentBuilder {
    constructor() {
        this.reset();
    }

    reset() {
        this.componentId   = '';
        this.idMapping     = new Map();   // originalId -> new 6-char Bricks id
        this.properties    = [];
        this.propertyGroups = [];
        this.manualProperties = [];
    }

    /**
     * Main entry point.
     *
     * @param {Object} standardResult   - { content, globalClasses, ... } from converter
     * @param {Object} meta             - { category, description }
     * @param {Object} options          - { autoDetect, manualProperties, componentRootIds }
     */
    buildComponent(standardResult, meta = {}, options = {}) {
        const { content = [], globalClasses = [] } = standardResult;
        if (!content.length) return standardResult;

        const autoDetect         = options.autoDetect !== false;
        const allManualProps     = options.manualProperties || [];
        const componentRootIds   = options.componentRootIds || [];

        // If no roots selected just return standard output
        if (componentRootIds.length === 0) return standardResult;

        // --- Build a fast lookup map for the full element tree ---
        const elementMap = new Map(content.map(el => [el.id, el]));

        // --- Helper: depth of an element ---
        const getDepth = (id) => {
            let d = 0;
            let cur = elementMap.get(id);
            while (cur && cur.parent && cur.parent !== '0' && cur.parent !== 0) {
                d++;
                cur = elementMap.get(cur.parent);
            }
            return d;
        };

        // --- Helper: full subtree (array) rooted at parentId ---
        const getSubtree = (parentId, source) => {
            const children = source.filter(el => el.parent === parentId);
            let tree = [...children];
            children.forEach(c => { tree = tree.concat(getSubtree(c.id, source)); });
            return tree;
        };

        // Process deepest roots first to handle nesting correctly
        const sortedRoots = [...componentRootIds]
            .filter(id => elementMap.has(id))
            .sort((a, b) => getDepth(b) - getDepth(a));

        let currentContent   = [...content];
        const allComponentDefs = [];
        this.allIdMappings = {}; // Store all ID mappings

        sortedRoots.forEach(rootId => {
            this.reset();

            // Find root in current (possibly already partially-componentised) content
            const rootElement = currentContent.find(el => el.id === rootId);
            if (!rootElement) return;

            // Collect this component's elements
            const subtree          = getSubtree(rootElement.id, currentContent);
            const componentElements = [rootElement, ...subtree];
            const componentIds     = new Set(componentElements.map(el => el.id));

            // Scope manual props to this component
            this.manualProperties = allManualProps.filter(mp => componentIds.has(mp.elementId));

            // 1. New Bricks component id
            this.componentId = generateComponentId();

            // 2. ID re-mapping: old id -> new 6-char id
            this.idMapping = this.buildIdMapping(componentElements, rootElement.id);

            // 3. Build internal element list with remapped IDs
            const internalElements = this.buildInternalElements(componentElements, rootElement.id);

            // 4. Properties
            if (autoDetect) {
                this.autoDetectProperties(internalElements);
            }
            // Manual props always applied on top (override / extend auto)
            this.applyManualProperties();
            this.buildPropertyGroups();

            // 5. Component definition object
            const componentDef = this.buildComponentDefinition(internalElements, meta);
            allComponentDefs.push(componentDef);
            
            // Store the ID mapping for this component (reverse: new ID -> old ID)
            const reverseMapping = {};
            this.idMapping.forEach((newId, oldId) => {
                reverseMapping[newId] = oldId;
            });
            this.allIdMappings[this.componentId] = reverseMapping;

            // 6. Replace the subtree in currentContent with a lightweight instance element
            const instanceId = generateComponentId();
            // Bricks expects integer 0 for the root parent, not string '0'
            const instanceParent = (rootElement.parent === '0' || rootElement.parent === 0)
                ? 0
                : rootElement.parent;
            const instanceElement = {
                id:       instanceId,
                name:     rootElement.name,
                parent:   instanceParent,
                children: [],
                settings: {},
                label:    rootElement.label || this.formatLabel(rootElement.name),
                cid:      this.componentId,
            };

            currentContent = currentContent.filter(el => !componentIds.has(el.id));
            currentContent.push(instanceElement);

            // Fix parent's children array to point at instance
            const parentEl = currentContent.find(el => el.id === rootElement.parent);
            if (parentEl && Array.isArray(parentEl.children)) {
                parentEl.children = parentEl.children.map(
                    cid => (cid === rootId ? instanceId : cid)
                );
            }
        });

        return {
            content:       currentContent,
            source:        BRICKS_SOURCE,
            sourceUrl:     BRICKS_SOURCE_URL,
            version:       BRICKS_VERSION,
            components:    allComponentDefs,
            globalClasses: globalClasses || [],
            // Internal fields used by the UI (stripped before clipboard copy)
            idMappings:    this.allIdMappings || {},
        };
    }

    // ─── Internal Methods ────────────────────────────────────────────────

    buildIdMapping(elements, rootId) {
        const map = new Map();
        // Root element gets the component's own cid
        map.set(rootId, this.componentId);
        elements.forEach(el => {
            if (!map.has(el.id)) map.set(el.id, generateComponentId());
        });
        return map;
    }

    buildInternalElements(elements, rootId) {
        return elements.map(el => {
            const newId     = this.idMapping.get(el.id);
            const newParent = el.id === rootId
                ? 0
                : (this.idMapping.get(el.parent) ?? el.parent);

            const newChildren = (el.children || []).map(
                cid => this.idMapping.get(cid) ?? cid
            );

            const result = {
                id:       newId,
                name:     el.name,
                parent:   newParent,
                children: newChildren,
                settings: { ...el.settings },
                label:    el.label || this.formatLabel(el.name),
            };

            if (el.cid)            result.cid            = el.cid;
            if (el._skipTextNodes) result._skipTextNodes  = el._skipTextNodes;
            if (el._skipChildren)  result._skipChildren   = el._skipChildren;

            return result;
        });
    }

    autoDetectProperties(internalElements) {
        internalElements.forEach(el => {
            const keys = AUTO_DETECT_ELEMENTS[el.name];
            if (!keys) return;

            keys.forEach(settingKey => {
                const value = el.settings[settingKey];
                if (value === undefined || value === null) return;

                // Skip if a manual mapping already covers this element+key
                const alreadyMapped = this.manualProperties.some(
                    mp => this.idMapping.get(mp.elementId) === el.id && mp.settingKey === settingKey
                );
                if (alreadyMapped) return;

                this.properties.push({
                    id:      generateComponentId(),
                    label:   this.generatePropertyLabel(el, settingKey),
                    type:    this.resolvePropertyType(settingKey, el.name),
                    default: this.resolveDefaultValue(settingKey, value),
                    connections: { [el.id]: [settingKey] },
                });
            });
        });
    }

    applyManualProperties() {
        this.manualProperties.forEach(mp => {
            // The element ID stored in mp.elementId is the ORIGINAL id.
            // We must remap it to the new internal id.
            const newElId = this.idMapping.get(mp.elementId) || mp.elementId;

            // Check if auto-detect already covered this slot
            const existing = this.properties.find(
                p => p.connections && p.connections[newElId]?.includes(mp.settingKey)
            );

            if (existing) {
                if (mp.label) existing.label = mp.label;
                if (mp.type)  existing.type  = mp.type;
                if (mp.default !== undefined) existing.default = mp.default;
                return;
            }

            this.properties.push({
                id:      generateComponentId(),
                label:   mp.label || `Property ${this.properties.length + 1}`,
                type:    mp.type  || 'text',
                default: mp.default ?? '',
                connections: { [newElId]: [mp.settingKey] },
                ...(mp.group ? { group: mp.group } : {}),
            });
        });
    }

    buildPropertyGroups() {
        const byElement = new Map();
        this.properties.forEach(prop => {
            if (!prop.connections) return;
            Object.keys(prop.connections).forEach(elId => {
                if (!byElement.has(elId)) byElement.set(elId, []);
                byElement.get(elId).push(prop);
            });
        });

        byElement.forEach(props => {
            if (props.length < 2) return;
            const hasText = props.some(p => p.type === 'text');
            const hasLink = props.some(p => p.type === 'link');
            if (!hasText || !hasLink) return;

            const groupId    = generateComponentId();
            const groupLabel = props[0].label.replace(/\s+(Text|Link)$/i, '') || 'Group';
            props.forEach(p => { p.group = groupId; });
            this.propertyGroups.push({ id: groupId, name: groupLabel });
        });
    }

    buildComponentDefinition(internalElements, meta = {}) {
        const def = {
            id:         this.componentId,
            category:   meta.category    || '',
            desc:       meta.description || '',
            elements:   internalElements,
            properties: this.properties,
            _created:   Math.floor(Date.now() / 1000),
            _user_id:   1,
            _version:   BRICKS_VERSION,
        };
        if (this.propertyGroups.length > 0) def.propertyGroups = this.propertyGroups;
        return def;
    }

    // ─── Utility helpers ─────────────────────────────────────────────────

    resolvePropertyType(settingKey, elementName) {
        if (settingKey === 'icon')  return 'icon';
        if (settingKey === 'image') return 'image';
        if (settingKey === 'link')  return 'link';
        if (settingKey === 'text')  return 'text';
        if (settingKey === 'src' && elementName === 'image') return 'image';
        return 'text';
    }

    resolveDefaultValue(settingKey, value) {
        if (settingKey === 'image') {
            if (typeof value === 'object' && value.url) return value;
            return { url: String(value), external: true, filename: this.extractFilename(String(value)) };
        }
        if (settingKey === 'link') {
            if (typeof value === 'object') return { type: value.type || 'external', url: value.url || '#' };
            return { type: 'external', url: String(value) };
        }
        if (settingKey === 'icon') {
            if (typeof value === 'object') return value;
            return { library: 'themify', icon: String(value) };
        }
        return value;
    }

    generatePropertyLabel(element, settingKey) {
        // First try to get label from the element itself
        let raw = (element.label || element.name || '')
            .replace(/^\./,  '')
            .replace(/__/g,  ' ')
            .replace(/--/g,  ' ')
            .replace(/[-_]/g,' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
        
        // If element label is empty or generic, try to get it from parent
        if (!raw || raw === 'Div' || raw === 'Text-basic' || raw === 'Text') {
            // Find parent element in internalElements
            const parentEl = this.internalElements?.find(el => el.id === element.parent);
            if (parentEl) {
                const parentLabel = (parentEl.label || parentEl.name || '')
                    .replace(/^\./,  '')
                    .replace(/__/g,  ' ')
                    .replace(/--/g,  ' ')
                    .replace(/[-_]/g,' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
                    .trim();
                
                // Use parent label if it's more descriptive
                if (parentLabel && parentLabel !== 'Div' && parentLabel !== 'Text-basic' && parentLabel !== 'Text') {
                    raw = parentLabel;
                }
            }
        }
        
        if (settingKey === 'link') return `${raw} Link`;
        return raw || 'Property';
    }

    formatLabel(label) {
        if (!label) return '';
        return label
            .replace(/__/g,  ' ')
            .replace(/--/g,  ' ')
            .replace(/[-_]/g,' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    extractFilename(url) {
        try { return new URL(url).pathname.split('/').pop() || url; }
        catch { return url; }
    }
}
