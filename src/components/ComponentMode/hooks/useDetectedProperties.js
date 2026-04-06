import { useMemo } from 'react';

/**
 * Hook to parse and organize detected properties from JSON output
 * @param {string} output - JSON output string
 * @param {boolean} componentMode - Whether component mode is enabled
 * @returns {Object} Map of componentId -> properties array
 */
export const useDetectedProperties = (output, componentMode) => {
  return useMemo(() => {
    if (!output || !componentMode) return {};
    
    try {
      const parsed = JSON.parse(output);
      const result = {};
      
      // Build a mapping from component ID to properties
      (parsed.components || []).forEach(comp => {
        result[comp.id] = comp.properties || [];
      });
      
      return result;
    } catch {
      return {};
    }
  }, [output, componentMode]);
};

/**
 * Hook to map component root IDs to their component definition IDs
 * @param {string} output - JSON output string
 * @param {boolean} componentMode - Whether component mode is enabled
 * @param {Array} componentRootIds - Array of component root IDs
 * @returns {Object} Map of rootId -> componentId
 */
export const useRootToComponentMapping = (output, componentMode, componentRootIds) => {
  return useMemo(() => {
    if (!output || !componentMode || componentRootIds.length === 0) return {};
    
    try {
      const parsed = JSON.parse(output);
      const mapping = {};
      
      // Try to match component roots to component definitions
      (parsed.components || []).forEach(comp => {
        if (componentRootIds.includes(comp.id)) {
          mapping[comp.id] = comp.id;
        }
      });
      
      // If no direct match, map by index
      if (Object.keys(mapping).length === 0) {
        componentRootIds.forEach((rootId, index) => {
          if (parsed.components[index]) {
            mapping[rootId] = parsed.components[index].id;
          }
        });
      }
      
      return mapping;
    } catch {
      return {};
    }
  }, [output, componentMode, componentRootIds]);
};
