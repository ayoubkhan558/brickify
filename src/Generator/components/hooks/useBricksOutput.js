import { useEffect, useRef } from 'react';
import { createBricksStructure } from '../../utils/bricksGenerator';
import logger from '@lib/logger';

/**
 * Hook that runs createBricksStructure whenever the input code or settings change
 * and writes the clean JSON to the output state.
 *
 * Internal Bricks fields (rawContent, idMappings) are kept in a ref so they
 * never leak into the clipboard / exported JSON payload.
 *
 * @returns {{ componentInternals: React.MutableRefObject }} ref with rawContent & idMappings
 */
export function useBricksOutput({
  html,
  css,
  js,
  activeTab,
  includeJs,
  inlineStyleHandling,
  isMinified,
  showNodeClass,
  mergeNonClassSelectors,
  componentMode,
  componentAutoDetect,
  componentMeta,
  componentManualProperties,
  componentRootIds,
  setOutput,
}) {
  const componentInternals = useRef({ rawContent: null, idMappings: null });

  useEffect(() => {
    try {
      if (html.trim()) {
        const shouldIncludeJs = activeTab === 'js';
        const result = createBricksStructure(html, css, shouldIncludeJs ? js : '', {
          context: {
            showNodeClass,
            inlineStyleHandling,
            mergeNonClassSelectors,
            componentMode,
            componentAutoDetect,
            componentCategory: componentMeta.category,
            componentDescription: componentMeta.description,
            componentManualProperties: !componentAutoDetect ? componentManualProperties : [],
            componentRootIds,
          },
        });

        // Keep internal fields out of the clean Bricks output
        componentInternals.current = {
          rawContent: result.rawContent || null,
          idMappings: result.idMappings || null,
        };

        const cleanResult = { ...result };
        delete cleanResult.rawContent;
        delete cleanResult.idMappings;

        const json = isMinified
          ? JSON.stringify(cleanResult)
          : JSON.stringify(cleanResult, null, 2);
        setOutput(json);
      } else {
        setOutput('');
      }
    } catch (err) {
      logger.error('Failed to generate Bricks structure', {
        file: 'useBricksOutput.js',
        step: 'useEffect - createBricksStructure',
        feature: 'HTML to Bricks Conversion',
      }, err);
    }
  }, [
    html, css, js,
    includeJs, activeTab,
    inlineStyleHandling, isMinified,
    showNodeClass, mergeNonClassSelectors,
    componentMode, componentAutoDetect,
    componentMeta, componentManualProperties, componentRootIds,
    setOutput,
  ]);

  return { componentInternals };
}
