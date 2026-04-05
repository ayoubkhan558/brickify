import React, { useState } from 'react';

const PROPERTY_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'Link' },
  { value: 'select', label: 'Select' },
  { value: 'toggle', label: 'Toggle' },
];

const PropertyConfigurator = ({ onAdd, onCancel, elementId = '', settingKey = '' }) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [defaultValue, setDefaultValue] = useState('');
  const [elId, setElId] = useState(elementId);
  const [setting, setSetting] = useState(settingKey);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) return;

    onAdd({
      label: label.trim(),
      type,
      default: defaultValue,
      elementId: elId,
      settingKey: setting || 'text',
    });
  };

  return (
    <form className="property-configurator" onSubmit={handleSubmit}>
      <div className="property-configurator__field">
        <label>Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Property label"
          autoFocus
        />
      </div>

      <div className="property-configurator__field">
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {PROPERTY_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="property-configurator__field">
        <label>Default Value</label>
        <input
          type="text"
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          placeholder="Default value..."
        />
      </div>

      {!elementId && (
        <>
          <div className="property-configurator__field">
            <label>Element ID</label>
            <input
              type="text"
              value={elId}
              onChange={(e) => setElId(e.target.value)}
              placeholder="Target element ID"
            />
          </div>

          <div className="property-configurator__field">
            <label>Setting Key</label>
            <input
              type="text"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="e.g. text, image, link"
            />
          </div>
        </>
      )}

      <div className="property-configurator__actions">
        <button type="submit" className="btn-add">Add</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default PropertyConfigurator;
