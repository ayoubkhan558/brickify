import { createContext, useContext, useState, useEffect } from 'react';

const GeneratorContext = createContext();

export function GeneratorProvider({ children }) {
  // Editor states
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [output, setOutput] = useState('');

  // UI & generator settings
  const [activeTab, setActiveTab] = useState('html');
  const [isMinified, setIsMinified] = useState(false);
  const [includeJs, setIncludeJs] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [inlineStyleHandling, setInlineStyleHandling] = useState('inline'); // 'skip'|'inline'|'class'
  const [showNodeClass, setShowNodeClass] = useState(true);
  const [mergeNonClassSelectors, setMergeNonClassSelectors] = useState(false);

  // Component Mode states
  const [componentMode, setComponentMode] = useState(false);
  const [componentAutoDetect, setComponentAutoDetect] = useState(true); // true = auto, false = manual
  const [componentMeta, setComponentMeta] = useState({
    category: '',
    description: '',
  });
  const [componentManualProperties, setComponentManualProperties] = useState([]);
  const [componentRootIds, setComponentRootIds] = useState([]);
  const [activeComponentRootId, setActiveComponentRootId] = useState(null); // which root is "focused"
  const [layerElements, setLayerElements] = useState([]);  // raw flat element array (pre-conversion)

  // Dark-mode handling (matches Zustand logic)
  const prefersDark = () => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  };
  const [isDarkMode, setIsDarkMode] = useState(prefersDark);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleMinified = () => setIsMinified(prev => !prev);
  const toggleComponentMode = () => setComponentMode(prev => !prev);

  // Keep <html> data-theme & localStorage in sync
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const value = {
    // code
    html, css, js, output,
    setHtml, setCss, setJs, setOutput,

    // ui
    activeTab, setActiveTab,
    isMinified, toggleMinified,
    includeJs, setIncludeJs,
    showJsonPreview, setShowJsonPreview,
    isCopied, setIsCopied,
    inlineStyleHandling, setInlineStyleHandling,
    showNodeClass, setShowNodeClass,
    mergeNonClassSelectors, setMergeNonClassSelectors,
    isDarkMode, toggleDarkMode,

    // component mode
    componentMode, setComponentMode, toggleComponentMode,
    componentAutoDetect, setComponentAutoDetect,
    componentMeta, setComponentMeta,
    componentManualProperties, setComponentManualProperties,
    componentRootIds, setComponentRootIds,
    activeComponentRootId, setActiveComponentRootId,
    layerElements, setLayerElements,
  };

  return <GeneratorContext.Provider value={value}>{children}</GeneratorContext.Provider>;
}

export function useGenerator() {
  const ctx = useContext(GeneratorContext);
  if (!ctx) throw new Error('useGenerator must be used within a GeneratorProvider');
  return ctx;
}

