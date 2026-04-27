// display.js - Unified display property mapper

export const displayMappers = {
  'display': (val, settings) => {
    // Set _display for all valid values (grid, flex, block, inline-block, none, etc.)
    settings._display = val;
    
    // Set specific flags for grid and flex since Bricks uses these for advanced layout controls
    if (val === 'grid' || val === 'inline-grid') {
      settings._isGrid = true;
    } else if (val === 'flex' || val === 'inline-flex') {
      settings._isFlex = true;
    }
  }
};

// Export for direct import
export const displayMapper = displayMappers['display'];