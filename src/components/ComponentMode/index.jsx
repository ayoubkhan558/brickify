import React, { useState, useMemo } from 'react';
import { useGenerator } from '@contexts/GeneratorContext';
import { FaPlug, FaWandMagicSparkles, FaHandPointer, FaTrash } from 'react-icons/fa6';
import { BsGearFill, BsBricks } from 'react-icons/bs';
import PropertyConfigurator from './PropertyConfigurator';
import { 
  useElementToRootMapping, 
  useDetectedProperties, 
  useRootToComponentMapping,
  usePropertyHandlers 
} from './hooks';
import './ComponentMode.scss';

const ComponentMode = ({ output, componentInternals }) => {
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

  // Custom hooks for logic separation
  const elementToRootId = useElementToRootMapping(layerElements, componentRootIds);
  const detectedPropertiesByRoot = useDetectedProperties(output, componentMode);
  const rootIdToComponentId = useRootToComponentMapping(output, componentMode, componentRootIds);

  // Get detected properties for the active component root
  const activeDetectedProperties = useMemo(() => {
    if (!activeComponentRootId || !output || !componentMode) return [];

    // Find which component ID maps to this active root
    const componentId = rootIdToComponentId[activeComponentRootId];
    if (componentId && detectedPropertiesByRoot[componentId]) {
      return detectedPropertiesByRoot[componentId];
    }

    // Fallback: if no mapping found, try to find by index
    const rootIndex = componentRootIds.indexOf(activeComponentRootId);
    if (rootIndex >= 0) {
      try {
        const parsed = JSON.parse(output);
        return parsed.components?.[rootIndex]?.properties || [];
      } catch {
        return [];
      }
    }

    return [];
  }, [activeComponentRootId, output, componentMode, rootIdToComponentId, detectedPropertiesByRoot, componentRootIds]);

  // Manual properties scoped to the active component root
  const activeManualProperties = useMemo(() => {
    if (!activeComponentRootId) return componentManualProperties;
    return componentManualProperties.filter(
      mp => elementToRootId.get(mp.elementId) === activeComponentRootId
    );
  }, [componentManualProperties, activeComponentRootId, elementToRootId]);
  
  // Property handlers from custom hook
  const {
    handleSwitchToManual: switchToManual,
    handleAddManualProperty: addManualProperty,
    handleRemoveManualProperty,
    handleUpdateManualProperty,
  } = usePropertyHandlers({
    activeDetectedProperties,
    activeComponentRootId,
    componentManualProperties,
    setComponentManualProperties,
    setComponentAutoDetect,
    elementToRootId,
    componentInternals,
  });
  
  const handleMetaChange = (field, value) => {
    setComponentMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleAddManualProperty = (property) => {
    addManualProperty(property);
    setShowPropertyForm(false);
  };

  const handleSwitchToManual = () => {
    switchToManual();
  };
  
  const handleReset = () => {
    setComponentRootIds([]);
    setComponentManualProperties([]);
    setActiveComponentRootId(null);
    setComponentMode(false);
  };

  if (!componentMode) return null;

  const propertiesToShow = componentAutoDetect ? activeDetectedProperties : activeManualProperties;

  // Debug logging (only in development)
  if (import.meta.env.DEV) {
    console.log('ComponentMode Debug:', {
      activeComponentRootId,
      componentRootIds,
      componentAutoDetect,
      detectedPropertiesByRoot,
      rootIdToComponentId,
      activeDetectedProperties,
      propertiesToShowCount: propertiesToShow.length
    });
  }

  // Get a display label for each root
  const getRootLabel = (rootId) => {
    const el = layerElements.find(e => e.id === rootId);
    if (!el) return rootId;
    const cls = el.settings?._cssGlobalClasses?.[0];
    return el.label || (cls ? `.${cls}` : el.name) || rootId;
  };

  return (
    <div className="component-mode">

      {/* Component Selector — shown when multiple roots are selected */}
      {componentRootIds.length > 1 && (
        <div className="component-mode__section" style={{ display: 'none' }}>
          <h4 className="component-mode__title">
            <BsBricks size={12} />
            Components ({componentRootIds.length})
          </h4>
          <div className="component-mode__root-list">
            {componentRootIds.map(rootId => {
              const isActive = activeComponentRootId === rootId;
              const label = getRootLabel(rootId);
              const hasProperties = detectedPropertiesByRoot[rootIdToComponentId[rootId]]?.length > 0;

              return (
                <button
                  key={rootId}
                  className={`component-root-chip ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveComponentRootId(rootId);
                    console.log('Selected component root:', rootId, 'Label:', label);
                  }}
                  title={`Click to view ${label}'s properties`}
                >
                  {label}
                  {isActive && <span className="active-indicator">●</span>}
                  {!isActive && hasProperties && <span className="has-props-indicator">◆</span>}
                </button>
              );
            })}
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
            onClick={handleSwitchToManual}
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

      {/* Component Meta - only show when at least one component root is selected */}
      {componentRootIds.length > 0 && (
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
      )}
    </div>
  );
};

export default ComponentMode;
