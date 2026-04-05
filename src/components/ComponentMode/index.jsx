import React, { useState, useMemo } from 'react';
import { useGenerator } from '@contexts/GeneratorContext';
import { FaPlug, FaWandMagicSparkles, FaHandPointer, FaTrash } from 'react-icons/fa6';
import { BsGearFill } from 'react-icons/bs';
import PropertyConfigurator from './PropertyConfigurator';
import './ComponentMode.scss';

const ComponentMode = ({ output }) => {
  const {
    componentMode,
    toggleComponentMode,
    componentAutoDetect,
    setComponentAutoDetect,
    componentMeta,
    setComponentMeta,
    componentManualProperties,
    setComponentManualProperties,
  } = useGenerator();

  const [showPropertyForm, setShowPropertyForm] = useState(false);

  // Extract auto-detected properties from the component output
  const detectedProperties = useMemo(() => {
    if (!output || !componentMode) return [];
    try {
      const parsed = JSON.parse(output);
      if (parsed.components?.length > 0) {
        return parsed.components[0].properties || [];
      }
    } catch (e) {
      // ignore parse errors
    }
    return [];
  }, [output, componentMode]);

  const handleMetaChange = (field, value) => {
    setComponentMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleAddManualProperty = (property) => {
    setComponentManualProperties(prev => [...prev, property]);
    setShowPropertyForm(false);
  };

  const handleRemoveManualProperty = (index) => {
    setComponentManualProperties(prev => prev.filter((_, i) => i !== index));
  };

  if (!componentMode) return null;

  // Choose which properties list to show
  const propertiesToShow = componentAutoDetect ? detectedProperties : componentManualProperties;

  return (
    <div className="component-mode">
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
      </div>

      <div className="component-mode__section">
        <h4 className="component-mode__title">
          <FaPlug size={12} />
          Property Detection
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
            Properties will be auto-detected from text, images, and links.
          </p>
        )}

        {!componentAutoDetect && (
          <p className="component-mode__hint">
            Click elements in the Layers view to expose as properties, or add manually below.
          </p>
        )}
      </div>

      {/* Properties List — shows auto-detected or manual properties */}
      {propertiesToShow.length > 0 && (
        <div className="component-mode__section">
          <h4 className="component-mode__title">
            <FaPlug size={12} />
            Properties ({propertiesToShow.length})
          </h4>

          <ul className="component-mode__properties-list">
            {propertiesToShow.map((prop, idx) => (
              <li key={idx} className="component-mode__property-item">
                <span className="prop-label">{prop.label}</span>
                <span className={`prop-type prop-type--${prop.type}`}>{prop.type}</span>
                {!componentAutoDetect && (
                  <button
                    className="prop-remove"
                    onClick={() => handleRemoveManualProperty(idx)}
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

      {/* Manual mode: Add Property */}
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
