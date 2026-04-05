import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { RiJavascriptLine, RiHtml5Line } from "react-icons/ri";
import { FaCss3, FaCode, FaCopy, FaPlay, FaCheck, FaDownload, FaChevronDown, FaPaperPlane, FaSpinner } from "react-icons/fa6";
import { MdOutlineSettings } from "react-icons/md";
import { FaInfoCircle, FaCog, FaQuestionCircle, FaExclamationTriangle, FaCommentDots, FaGithub, FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { VscCopy } from "react-icons/vsc";
import Header from '@components/Header/index';
import AboutModal from '@components/AboutModal/index';
import TutorialModal from '@components/TutorialModal/index';
import LimitationsModal from '@components/LimitationsModal/index';
import InfoPanel from '@components/InfoPanel/index';
import AISettings from '@components/AISettings/index';
import Tooltip from '@components/Tooltip';
import ComponentMode from '@components/ComponentMode';
import logger from '@lib/logger';

import { useGenerator } from '@contexts/GeneratorContext';
import { createBricksStructure } from '../utils/bricksGenerator';
import Preview from './Preview';
import CodeEditor from '@generator/CodeEditor';
import StructureView from './StructureView';
import './GeneratorComponent.scss';
import aiModels from '@config/aiModels.json';
import { TemplateSelector } from '@components/AITemplates';
import AIPromptModal from '@components/AIPromptModal';
import { QuickActionTags } from '@components/QuickActionTags';

// Custom hooks
import { useAIGeneration, useCodeFormatting, useClipboard, useAITemplates } from './hooks';

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
  } = useGenerator();

  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isLimitationsOpen, setIsLimitationsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rightPanelView, setRightPanelView] = useState('layers'); // 'layers' or 'json'
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);

  // Custom hooks
  const formatting = useCodeFormatting();
  const clipboard = useClipboard();
  const aiTemplates = useAITemplates();
  const aiGeneration = useAIGeneration(activeTab, html, css, js, setHtml, setCss, setJs, aiTemplates);



  // Generate Bricks structure from current inputs
  const previewHtml = useMemo(() => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.innerHTML || '';
    } catch (e) {
      return html;
    }
  }, [html]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.split-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle quick action click - automatically trigger AI generation with template
  const handleQuickAction = async (templateId) => {
    // Find the template
    const template = aiTemplates.templates.find(t => t.id === templateId);
    if (!template) return;

    // Set a descriptive prompt based on the template and trigger AI generation
    aiGeneration.setQuickPrompt(`Apply ${template.name} to the existing code`);

    // Small delay to ensure prompt is set before triggering
    setTimeout(() => {
      aiGeneration.handleQuickGenerate();
    }, 50);
  };


  useEffect(() => {
    try {
      if (html.trim()) {
        const includeJs = activeTab === 'js';
        // logger.log('Creating bricks structure with context:', { showNodeClass, inlineStyleHandling });
        const result = createBricksStructure(html, css, includeJs ? js : '', {
          context: {
            showNodeClass,
            inlineStyleHandling,
            mergeNonClassSelectors,
            // Component mode options
            componentMode,
            componentAutoDetect,
            componentCategory: componentMeta.category,
            componentDescription: componentMeta.description,
            componentManualProperties: !componentAutoDetect ? componentManualProperties : [],
          }
        });
        const json = isMinified
          ? JSON.stringify(result)
          : JSON.stringify(result, null, 2);
        setOutput(json);
      } else {
        setOutput('');
      }
    } catch (err) {
      logger.error('Failed to generate Bricks structure', {
        file: 'GeneratorComponent.jsx',
        step: 'useEffect - createBricksStructure',
        feature: 'HTML to Bricks Conversion'
      }, err);
      // Optionally, you can set an error state here to show in the UI
    }
  }, [html, css, js, includeJs, inlineStyleHandling, isMinified, showNodeClass, mergeNonClassSelectors,
      componentMode, componentAutoDetect, componentMeta, componentManualProperties]);

  return (
    <div className="generator">
      {/* Header */}
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
        {/* Resizable Panel Layout */}
        <PanelGroup direction="horizontal" className="panel-group">
          {/* Left Panel - Code Editors */}
          <Panel defaultSize={33} minSize={20} className="panel-left" style={{ borderRight: '2px solid var(--color-border)' }}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30} className="panel-code-editor">
                <div className="code-editor">
                  <div className="code-editor__header">
                    <div className="code-editor__tabs">
                      <button
                        className={`code-editor__tab ${activeTab === 'html' ? 'active' : ''}`}
                        onClick={() => setActiveTab('html')}
                      >
                        <RiHtml5Line size={16} style={{ marginRight: 6 }} />
                        HTML
                      </button>
                      <button
                        className={`code-editor__tab ${activeTab === 'css' ? 'active' : ''}`}
                        onClick={() => setActiveTab('css')}
                      >
                        <FaCss3 size={16} style={{ marginRight: 6 }} />
                        CSS
                      </button>
                      <button
                        className={`code-editor__tab ${activeTab === 'js' ? 'active' : ''}`}
                        onClick={() => setActiveTab('js')}
                      >
                        <RiJavascriptLine size={16} style={{ marginRight: 6 }} />
                        JS
                      </button>
                    </div>

                    <div className="code-editor__actions">
                      <button
                        className="code-editor__action"
                        onClick={(e) => {
                          e.stopPropagation();
                          formatting.formatCurrent(activeTab, html, css, js, setHtml, setCss, setJs);
                        }}
                        data-tooltip-id="format-tooltip"
                        data-tooltip-content="Auto Format & indent code"
                      >
                        Format
                      </button>
                      <Tooltip id="format-tooltip" place="top" effect="solid" />
                    </div>
                  </div>
                  <div className="code-editor__content">
                    <div className="code-editor__pane active">
                      <CodeEditor
                        value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
                        onChange={activeTab === 'html' ? setHtml : activeTab === 'css' ? setCss : setJs}
                        language={activeTab}
                        placeholder={
                          activeTab === 'html'
                            ?
                            `<!-- Your HTML here… -->
                            
<section>
  <h1>My First Heading</h1>
  <p>My first paragraph.</p>
</section>
                            `
                            : activeTab === 'css'
                              ? '/* Your CSS here… */'
                              : '// Your JavaScript here…'
                        }
                        height="100%"
                        className="code-editor__content"
                        onCursorTagIndexChange={setActiveTagIndex}
                      />
                    </div>
                  </div>

                  {/* Quick Action Tags - Show when code exists */}
                  <QuickActionTags
                    templates={aiTemplates.templates}
                    activeTab={activeTab}
                    hasCode={activeTab === 'html' ? !!html.trim() : activeTab === 'css' ? !!css.trim() : !!js.trim()}
                    onActionClick={handleQuickAction}
                    isGenerating={aiGeneration.isQuickGenerating}
                  />


                </div>
              </Panel>

              <PanelResizeHandle className="resize-handle resize-handle--horizontal" />
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle--vertical" />

          {/* Center Panel - Preview */}
          <Panel defaultSize={34} minSize={20} className="panel-center" style={{ borderRight: '2px solid var(--color-border)' }}>
            <div className="preview-container">
              <div className="preview-header">
                <h3>Preview</h3>
                <div className="preview-actions"></div>
              </div>
              <div className="preview-content">
                {html || css || js ? (
                  <Preview html={html} css={css} activeTagIndex={activeTagIndex} highlight={activeTab === 'html'} />
                ) : (
                  <div className="preview-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    <p>Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle--vertical" />

          {/* Right Panel - Structure/JSON */}
          <Panel defaultSize={20} minSize={15} maxSize={25} className="panel-right">
            <div className="structure-panel">
              <div className="structure-panel__header">
                {/* Toggle between Layers and JSON */}
                <div className="view-toggle">
                  <button
                    className={`view-toggle__btn ${rightPanelView === 'layers' ? 'active' : ''}`}
                    onClick={() => setRightPanelView('layers')}
                  >
                    Layers
                  </button>
                  <button
                    className={`view-toggle__btn ${rightPanelView === 'json' ? 'active' : ''}`}
                    onClick={() => setRightPanelView('json')}
                  >
                    JSON
                  </button>
                </div>
              </div>
              <div className="structure-panel__content">
                {rightPanelView === 'layers' ? (
                  // Layers View
                  output ? (() => {
                    const parsed = JSON.parse(output);
                    // In component mode, the full element tree is inside components[0].elements
                    const layerData = componentMode && parsed.components?.length > 0
                      ? parsed.components[0].elements
                      : parsed.content;
                    const componentProperties = componentMode && parsed.components?.length > 0
                      ? parsed.components[0].properties
                      : [];
                    return (
                      <StructureView
                        data={layerData || []}
                        globalClasses={parsed.globalClasses || []}
                        activeIndex={activeTagIndex}
                        showNodeClass={showNodeClass}
                        componentProperties={componentProperties}
                      />
                    );
                  })() : (
                    <div className="structure-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <p style={{ color: 'var(--color-text-2)', fontSize: 13, marginTop: 12 }}>No structure generated</p>
                    </div>
                  )
                ) : (
                  // JSON View
                  output ? (
                    <div style={{ height: '100%', overflow: 'hidden' }}>
                      <CodeEditor
                        value={isMinified ? output : formatting.formatJson(output)}
                        onChange={() => { }} // Read-only
                        language="json"
                        height="100%"
                        readOnly={true}
                        lineNumbers="off"
                        minimap={false}
                      />
                    </div>
                  ) : (
                    <div className="structure-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <circle cx="12" cy="15" r="3"></circle>
                      </svg>
                      <p style={{ color: 'var(--color-text-2)', fontSize: 13, marginTop: 12 }}>No JSON output</p>
                    </div>
                  )
                )}
              </div>

              {/* Component Mode Settings Panel - fixed at bottom of right panel */}
              <ComponentMode output={output} />
            </div>
          </Panel>

        </PanelGroup>
      </main>
      {/* Info Sidebar */}
      <InfoPanel
        onTutorialOpen={() => setIsTutorialOpen(true)}
        onLimitationsOpen={() => setIsLimitationsOpen(true)}
        onAboutOpen={() => setIsAboutOpen(true)}
        onAIPromptOpen={() => setIsAIPromptOpen(true)}
        onAISettingsOpen={() => aiGeneration.setIsAISettingsOpen(true)}
        aiTemplates={aiTemplates}
        isQuickGenerating={aiGeneration.isQuickGenerating}
      />

      {/* AI Components */}
      <AISettings
        isOpen={aiGeneration.isAISettingsOpen}
        onClose={() => aiGeneration.setIsAISettingsOpen(false)}
      />

      {/* AI Prompt Modal */}
      <AIPromptModal
        isOpen={isAIPromptOpen}
        onClose={() => setIsAIPromptOpen(false)}
        aiGeneration={aiGeneration}
        aiTemplates={aiTemplates}
        activeTab={activeTab}
      />

      {/* Info Modals */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      <LimitationsModal
        isOpen={isLimitationsOpen}
        onClose={() => setIsLimitationsOpen(false)}
      />
    </div>
  );
};

export default GeneratorComponent;