import { useCallback } from 'react';

/**
 * Hook to handle property conversion and management
 * @param {Object} dependencies - Required state and setters
 * @returns {Object} Handler functions
 */
export const usePropertyHandlers = ({
  activeDetectedProperties,
  activeComponentRootId,
  output,
  componentManualProperties,
  setComponentManualProperties,
  setComponentAutoDetect,
  elementToRootId,
}) => {
  /**
   * Convert auto-detected properties to manual properties when switching to manual mode
   */
  const handleSwitchToManual = useCallback(() => {
    if (activeDetectedProperties.length > 0 && activeComponentRootId) {
      // Get the ID mappings from the output
      let idMappings = {};
      try {
        const parsed = JSON.parse(output);
        idMappings = parsed.idMappings || {};
      } catch {
        // If parsing fails, proceed without mapping
      }

      // Convert property connections to manual properties
      const convertPropertyToManual = (prop) => {
        if (!prop.connections) return [];
        
        return Object.entries(prop.connections).flatMap(([componentElementId, settingKeys]) => {
          // Find the original element ID from the mapping
          let originalElementId = componentElementId;
          
          // Search through all component mappings to find the original ID
          for (const [componentId, mapping] of Object.entries(idMappings)) {
            if (mapping[componentElementId]) {
              originalElementId = mapping[componentElementId];
              break;
            }
          }
          
          return settingKeys.map(settingKey => ({
            label: prop.label || 'Property',
            type: prop.type || 'text',
            default: prop.default ?? '',
            elementId: originalElementId,
            settingKey,
          }));
        });
      };

      // Convert all detected properties
      const newManualProps = activeDetectedProperties.flatMap(convertPropertyToManual);

      // Merge with existing manual properties (avoid duplicates)
      setComponentManualProperties(prev => {
        const existingKeys = new Set(
          prev.map(p => `${p.elementId}-${p.settingKey}`)
        );
        
        const uniqueNewProps = newManualProps.filter(
          p => !existingKeys.has(`${p.elementId}-${p.settingKey}`)
        );
        
        return [...prev, ...uniqueNewProps];
      });
    }
    
    setComponentAutoDetect(false);
  }, [
    activeDetectedProperties,
    activeComponentRootId,
    output,
    setComponentManualProperties,
    setComponentAutoDetect,
  ]);

  /**
   * Add a new manual property
   */
  const handleAddManualProperty = useCallback((property) => {
    setComponentManualProperties(prev => [...prev, property]);
  }, [setComponentManualProperties]);

  /**
   * Remove a manual property
   */
  const handleRemoveManualProperty = useCallback((mp) => {
    setComponentManualProperties(prev =>
      prev.filter(p => p.elementId !== mp.elementId || p.settingKey !== mp.settingKey)
    );
  }, [setComponentManualProperties]);

  /**
   * Update a manual property
   */
  const handleUpdateManualProperty = useCallback((mp, updates) => {
    setComponentManualProperties(prev =>
      prev.map(p =>
        (p.elementId === mp.elementId && p.settingKey === mp.settingKey)
          ? { ...p, ...updates }
          : p
      )
    );
  }, [setComponentManualProperties]);

  return {
    handleSwitchToManual,
    handleAddManualProperty,
    handleRemoveManualProperty,
    handleUpdateManualProperty,
  };
};
