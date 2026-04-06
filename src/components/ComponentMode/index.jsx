import React, { useState, useMemo } from 'react';
import { useGenerator } from '@contexts/GeneratorContext';
import { FaPlug, FaWandMagicSparkles, FaHandPointer, FaTrash } from 'react-icons/fa6';
import { BsGearFill, BsBricks } from 'react-icons/bs';
import PropertyConfigurator from './PropertyConfigurator';
import './ComponentMode.scss';

const ComponentMode = ({ output }) => {
  const {
    componentMode,
    setComponentMode,
    componentAutoDetect,
    setComponentAutoDetect,
    componentMeta,
    setComponentMeta,
    componentManualProperties,
    setComponentManualProperties,
    componentRootIds,
    setComponentRootIds,
    activeComponentRootId,
    setActiveComponentRootId,
    layerElements,
  } = useGenerator();

  const [showPropertyForm, setShowPropertyForm] = useState(false);

  // Build a map: elementId -> componentRootId owner (from the raw layer tree)
  const elementToRootId = useMemo(() => {
    const map = new Map();
    if (!layerElements || componentRootIds.length === 0) return map;
    const elementMap = new Map(layerElements.map(el => [el.id, el]));
    layerElements.forEach(el => {
      let curr = el;
      while (curr) {
        if (componentRootIds.includes(curr.id)) {
          map.set(el.id, curr.id);
          break;
        }
        curr = (curr.parent && curr.parent !== 0 && curr.parent !== '0')
          ? elementMap.get(curr.parent)
          : null;
      }
    });
    return map;
  }, [layerElements, componentRootIds]);

  // Auto-detected properties for the currently active component (parsed from JSON output)
  const detectedPropertiesByRoot = useMemo(() => {
    if (!output || !componentMode) return {};
    try {
      const parsed = JSON.parse(output);
      const result = {};
      (parsed.components || []).forEach(c => {
        result[c.id] = c.properties || [];
      });
      return result;
    } catch {
      return {};
    }
  }, [output, componentMode]);

  // Map the Bricks component `id` (cid) to the original componentRootId
  // The cid in parsed.components matches the cid on instance elements in parsed.content
  const cidToRootId = useMemo(() => {
    if (!output || !componentMode) return {};
    try {
      const parsed = JSON.parse(output);
      const result = {};
      // Each instance element in content has { cid, ... }
      (parsed.content || []).forEach(el => {
        if (el.cid) result[el.cid] = el.cid; // cid maps to itself in component defs
      });
      return result;
    } catch {
      return {};
    }
  }, [output, componentMode]);

  // Which component def maps to the active root? Look up by matching cid in output
  const activeDetectedProperties = useMemo(() => {
    if (!activeComponentRootId || !output || !componentMode) return [];
    try {
      const parsed = JSON.parse(output);
      // Find the instance in content that was originally the activeComponentRootId
      // We can match by checking which component def's id is present
      const components = parsed.components || [];
      // Simply show all components' properties merged for auto mode for now
      // (we can't reliably reverse-map cid -> original ID without extra bookkeeping)
      return components[0]?.properties || [];
    } catch {
      return [];
    }
  }, [output, componentMode, activeComponentRootId]);

  // Manual properties scoped to the active component root
  const activeManualProperties = useMemo(() => {
    if (!activeComponentRootId) return componentManualProperties;
    return componentManualProperties.filter(
      mp => elementToRootId.get(mp.elementId) === activeComponentRootId
    );
  }, [componentManualProperties, activeComponentRootId, elementToRootId]);

  const handleMetaChange = (field, value) => {
    setComponentMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleAddManualProperty = (property) => {
    setComponentManualProperties(prev => [...prev, property]);
    setShowPropertyForm(false);
  };

  const handleRemoveManualProperty = (mp) => {
    setComponentManualProperties(prev =>
      prev.filter(p => p.elementId !== mp.elementId || p.settingKey !== mp.settingKey)
    );
  };

  const handleUpdateManualProperty = (mp, updates) => {
    setComponentManualProperties(prev =>
      prev.map(p =>
        (p.elementId === mp.elementId && p.settingKey === mp.settingKey)
          ? { ...p, ...updates }
          : p
      )
    );
  };

  const handleReset = () => {
    setComponentRootIds([]);
    setComponentManualProperties([]);
    setActiveComponentRootId(null);
    setComponentMode(false);
  };

  if (!componentMode) return null;

  const propertiesToShow = componentAutoDetect ? activeDetectedProperties : activeManualProperties;

  // Get a display label for each root
  const getRootLabel = (rootId) => {
    const el = layerElements.find(e => e.id === rootId);
    if (!el) return rootId;
    const cls = el.settings?._cssGlobalClasses?.[0];
    return el.label || (cls ? `.${cls}` : el.name) || rootId;
  };

  return (
    <div className="component-mode">
      {/* Component Meta */}
      <div className="component-mode__section">
        <h4 className="component-mode__title">
          <BsGearFill size={12} />
          Component Meta
        </h4>

        <div className="component-mode__field">
          <label>Category</label>
          <input
            type="text"
            value={componentMeta.category}
            onChange={(e) => handleMetaChange('category', e.target.value)}
            placeholder="e.g. Section, Card, Hero"
          />
        </div>

        <div className="component-mode__field">
          <label>Description</label>
          <input
            type="text"
            value={componentMeta.description}
            onChange={(e) => handleMetaChange('description', e.target.value)}
            placeholder="Brief description..."
          />
        </div>

        <button className="component-mode__reset-btn" onClick={handleReset}>
          Reset Component Selections
        </button>
      </div>

      {/* Component Selector — shown when multiple roots are selected */}
      {componentRootIds.length > 1 && (
        <div className="component-mode__section">
          <h4 className="component-mode__title">
            <BsBricks size={12} />
            Components ({componentRootIds.length})
          </h4>
          <div className="component-mode__root-list">
            {componentRootIds.map(rootId => (
              <button
                key={rootId}
                className={`component-root-chip ${activeComponentRootId === rootId ? 'active' : ''}`}
                onClick={() => setActiveComponentRootId(rootId)}
                title="Click to view this component's properties"
              >
                {getRootLabel(rootId)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Property Detection Mode */}
      <div className="component-mode__section">
        <h4 className="component-mode__title">
          <FaPlug size={12} />
          Property Detection
          {activeComponentRootId && componentRootIds.length > 1 && (
            <span className="component-mode__active-label">
              → {getRootLabel(activeComponentRootId)}
            </span>
          )}
        </h4>

        <div className="component-mode__detection-toggle">
          <button
            className={`detection-btn ${componentAutoDetect ? 'active' : ''}`}
            onClick={() => setComponentAutoDetect(true)}
          >
            <FaWandMagicSparkles size={11} />
            Automatic
          </button>
          <button
            className={`detection-btn ${!componentAutoDetect ? 'active' : ''}`}
            onClick={() => setComponentAutoDetect(false)}
          >
            <FaHandPointer size={11} />
            Manual
          </button>
        </div>

        {componentAutoDetect && (
          <p className="component-mode__hint">
            Properties are auto-detected from text, images, and links.
          </p>
        )}
        {!componentAutoDetect && (
          <p className="component-mode__hint">
            Click elements in the Layers view to expose as properties.
          </p>
        )}
      </div>

      {/* Properties List */}
      {propertiesToShow.length > 0 && (
        <div className="component-mode__section">
          <h4 className="component-mode__title">
            <FaPlug size={12} />
            Properties ({propertiesToShow.length})
          </h4>

          <ul className="component-mode__properties-list">
            {propertiesToShow.map((prop, idx) => (
              <li key={idx} className="component-mode__property-item">
                {!componentAutoDetect ? (
                  <input
                    className="prop-label-input"
                    value={prop.label}
                    onChange={(e) => handleUpdateManualProperty(prop, { label: e.target.value })}
                  />
                ) : (
                  <span className="prop-label">{prop.label}</span>
                )}
                <span className={`prop-type prop-type--${prop.type}`}>{prop.type}</span>
                {!componentAutoDetect && (
                  <button
                    className="prop-remove"
                    onClick={() => handleRemoveManualProperty(prop)}
                    title="Remove property"
                  >
                    <FaTrash size={10} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manual mode: Add Property form */}
      {!componentAutoDetect && (
        <div className="component-mode__section">
          {showPropertyForm ? (
            <PropertyConfigurator
              onAdd={handleAddManualProperty}
              onCancel={() => setShowPropertyForm(false)}
            />
          ) : (
            <button
              className="component-mode__add-btn"
              onClick={() => setShowPropertyForm(true)}
            >
              + Add Property
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ComponentMode;
