// Main export for all property mappers
import { gridMappers } from './content-grid';
import { flexboxMappers } from './content-flexbox';
import { displayMappers } from './display';
import { spacingMappers } from './layout-spacing';
import { sizingMappers } from './layout-sizing';
import { positionMappers } from './layout-position';
import { typographyMappers } from './typography';
import { backgroundMappers } from './background';
import { borderBoxShadowMappers } from './boder-box-shadow';
import { transformsMappers } from './transforms';
import { scrollMappers } from './scroll';
import { scrollSnapMappers } from './layout-scroll-snap';
import { filterMappers, effectsMappers, transitionsMappers } from './filters-transitions';

export const CSS_PROP_MAPPERS = {
  ...gridMappers,
  ...flexboxMappers,
  ...displayMappers,
  ...spacingMappers,
  ...sizingMappers,
  ...positionMappers,
  ...typographyMappers,
  ...backgroundMappers,
  ...borderBoxShadowMappers,
  ...transformsMappers,
  ...scrollMappers,
  ...scrollSnapMappers,
  ...filterMappers,
  ...effectsMappers,
  ...transitionsMappers
};
