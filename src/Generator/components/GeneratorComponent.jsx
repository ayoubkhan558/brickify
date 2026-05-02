import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { FaCss3, FaCode, FaCopy, FaPlay, FaCheck, FaDownload, FaChevronDown, FaPaperPlane, FaSpinner } from 'react-icons/fa6';
import { MdOutlineSettings } from 'react-icons/md';
import { FaInfoCircle, FaCog, FaQuestionCircle, FaCommentDots, FaGithub, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { VscCopy } from 'react-icons/vsc';

import Header from '@components/Header/index';
import AboutModal from '@components/AboutModal/index';
import TutorialModal from '@components/TutorialModal/index';
import LimitationsModal from '@components/LimitationsModal/index';
import InfoPanel from '@components/InfoPanel/index';

import { useGenerator } from '@contexts/GeneratorContext';
import Preview from './Preview';
import CodeEditorPanel from './CodeEditorPanel';
import RightPanel from './RightPanel';
import './GeneratorComponent.scss';

import { useCodeFormatting, useClipboard, useHtmlCorrect, useBricksOutput } from './hooks';

const GeneratorComponent = () => {
  const {
    activeTab,
    setActiveTab,
    inlineStyleHandling,
    setInlineStyleHandling,
    showNodeClass,
    setShowNodeClass,
    mergeNonClassSelectors,
    setMergeNonClassSelectors,
    html,
    setHtml,
    css,
    setCss,
    js,
    setJs,
    output,
    setOutput,
    isDarkMode,
    isMinified,
    toggleMinified,
    includeJs,
    setIncludeJs,
    showJsonPreview,
    setShowJsonPreview,
    // Component mode
    componentMode,
    componentAutoDetect,
    componentMeta,
    componentManualProperties,
    setComponentManualProperties,
    componentRootIds,
    setComponentRootIds,
    activeComponentRootId,
    setActiveComponentRootId,
  } = useGenerator();

  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isLimitationsOpen, setIsLimitationsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rightPanelView, setRightPanelView] = useState('layers');

  // ── Custom hooks ────────────────────────────────────────────────────────────
  const formatting  = useCodeFormatting();
  const clipboard   = useClipboard();

  // HTML correct (strip structural tags, move style/script to tabs)
  const { handleHtmlChange, handleCorrectCode } = useHtmlCorrect({
    activeTab,
    html,
    setHtml,
    setCss,
    setJs,
    setComponentRootIds,
    setComponentManualProperties,
    setActiveComponentRootId,
  });

  // Bricks JSON output generation (runs on every code/settings change)
  const { componentInternals } = useBricksOutput({
    html, css, js,
    activeTab, includeJs,
    inlineStyleHandling, isMinified,
    showNodeClass, mergeNonClassSelectors,
    componentMode, componentAutoDetect,
    componentMeta, componentManualProperties, componentRootIds,
    setOutput,
  });

  // ── Theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.split-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="generator">
      {/* ── Header ── */}
      <Header
        inlineStyleHandling={inlineStyleHandling}
        setInlineStyleHandling={setInlineStyleHandling}
        mergeNonClassSelectors={mergeNonClassSelectors}
        setMergeNonClassSelectors={setMergeNonClassSelectors}
        showNodeClass={showNodeClass}
        setShowNodeClass={setShowNodeClass}
        output={output}
        html={html}
        clipboard={clipboard}
      />

      <main className="app-main">
        <PanelGroup direction="horizontal" className="panel-group">
          {/* ── Left: Code Editor ── */}
          <Panel defaultSize={33} minSize={20} className="panel-left" style={{ borderRight: '2px solid var(--color-border)' }}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30} className="panel-code-editor">
                <CodeEditorPanel
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  html={html}
                  css={css}
                  js={js}
                  handleHtmlChange={handleHtmlChange}
                  setCss={setCss}
                  setJs={setJs}
                  handleCorrectCode={handleCorrectCode}
                  formatting={formatting}
                  setActiveTagIndex={setActiveTagIndex}
                />
              </Panel>
              <PanelResizeHandle className="resize-handle resize-handle--horizontal" />
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle--vertical" />

          {/* ── Centre: Preview ── */}
          <Panel defaultSize={34} minSize={20} className="panel-center" style={{ borderRight: '2px solid var(--color-border)' }}>
            <div className="preview-container">
              <div className="preview-header">
                <h3>Preview</h3>
                <div className="preview-actions" />
              </div>
              <div className="preview-content">
                {html || css || js ? (
                  <Preview html={html} css={css} activeTagIndex={activeTagIndex} highlight={activeTab === 'html'} />
                ) : (
                  <div className="preview-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <p>Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle--vertical" />

          {/* ── Right: Layers / JSON + Component Mode ── */}
          <Panel defaultSize={20} minSize={15} maxSize={25} className="panel-right">
            <RightPanel
              output={output}
              componentInternals={componentInternals}
              componentMode={componentMode}
              activeTagIndex={activeTagIndex}
              showNodeClass={showNodeClass}
              isMinified={isMinified}
              formatting={formatting}
              rightPanelView={rightPanelView}
              setRightPanelView={setRightPanelView}
            />
          </Panel>
        </PanelGroup>
      </main>

      {/* ── Info Sidebar ── */}
      <InfoPanel
        onTutorialOpen={() => setIsTutorialOpen(true)}
        onLimitationsOpen={() => setIsLimitationsOpen(true)}
        onAboutOpen={() => setIsAboutOpen(true)}
      />

      {/* ── Info Modals ── */}
      <AboutModal      isOpen={isAboutOpen}       onClose={() => setIsAboutOpen(false)} />
      <TutorialModal   isOpen={isTutorialOpen}    onClose={() => setIsTutorialOpen(false)} />
      <LimitationsModal isOpen={isLimitationsOpen} onClose={() => setIsLimitationsOpen(false)} />
    </div>
  );
};

export default GeneratorComponent;
