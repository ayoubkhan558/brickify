import { useMemo } from 'react';

/**
 * Hook to build a map of element IDs to their component root owners
 * @param {Array} layerElements - Flat array of layer elements
 * @param {Array} componentRootIds - Array of component root element IDs
 * @returns {Map} Map of elementId -> componentRootId
 */
export const useElementToRootMapping = (layerElements, componentRootIds) => {
  return useMemo(() => {
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
};
