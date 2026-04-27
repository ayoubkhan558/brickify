import { useCallback } from 'react';
import { stripAndExtract } from '../../utils/htmlInputProcessor';

/**
 * Hook that manages the HTML "Correct" action:
 *  - strips structural tags (<html>, <head>, <body>) and their contents
 *  - moves <style> content to the CSS tab
 *  - moves inline <script> content to the JS tab
 *
 * Also provides the plain handleHtmlChange passthrough to avoid
 * auto-corrections on every keystroke.
 */
export function useHtmlCorrect({
  activeTab,
  html,
  setHtml,
  setCss,
  setJs,
  setComponentRootIds,
  setComponentManualProperties,
  setActiveComponentRootId,
}) {
  /** Pass-through change handler — no auto-correction on keystroke. */
  const handleHtmlChange = useCallback(
    (newHtml) => {
      setHtml(newHtml);
    },
    [setHtml]
  );

  /**
   * On-demand correction (triggered by the "Correct" button).
   * Only runs when the HTML tab is active and there is content.
   */
  const handleCorrectCode = useCallback(() => {
    if (activeTab !== 'html' || !html) return;

    const result = stripAndExtract(html);

    // Update HTML with structural tags removed
    setHtml(result.bodyContent);

    // Reset component-related state
    setComponentRootIds([]);
    setComponentManualProperties([]);
    setActiveComponentRootId(null);

    // Append extracted CSS to the style tab
    if (result.extractedCss) {
      setCss((prevCss) => {
        const existingCss = prevCss.trim();
        return existingCss
          ? `${existingCss}\n\n/* Extracted from <style> tags */\n${result.extractedCss}`
          : result.extractedCss;
      });
    }

    // Append extracted JS to the JS tab
    if (result.extractedJs) {
      setJs((prevJs) => {
        const existingJs = prevJs.trim();
        return existingJs
          ? `${existingJs}\n\n// Extracted from <script> tags\n${result.extractedJs}`
          : result.extractedJs;
      });
    }
  }, [
    activeTab,
    html,
    setHtml,
    setCss,
    setJs,
    setComponentRootIds,
    setComponentManualProperties,
    setActiveComponentRootId,
  ]);

  return { handleHtmlChange, handleCorrectCode };
}
