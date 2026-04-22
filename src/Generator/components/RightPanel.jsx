import React from 'react';
import CodeEditor from '@generator/CodeEditor';
import StructureView from './StructureView';
import ComponentMode from '@components/ComponentMode';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

/**
 * Right panel containing:
 *  - Top section: Layers / JSON view toggle + content
 *  - Bottom section: Component Mode settings
 */
const RightPanel = ({
  output,
  componentInternals,
  componentMode,
  activeTagIndex,
  showNodeClass,
  isMinified,
  formatting,
  rightPanelView,
  setRightPanelView,
}) => {
  const renderLayersContent = () => {
    if (!output) {
      return (
        <div className="structure-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p style={{ color: 'var(--color-text-2)', fontSize: 13, marginTop: 12 }}>No structure generated</p>
        </div>
      );
    }

    const parsed = JSON.parse(output);
    const layerData = componentMode && componentInternals.current.rawContent
      ? componentInternals.current.rawContent
      : parsed.content;
    const componentProperties =
      componentMode && parsed.components?.length > 0
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
  };

  const renderJsonContent = () => {
    if (!output) {
      return (
        <div className="structure-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <circle cx="12" cy="15" r="3" />
          </svg>
          <p style={{ color: 'var(--color-text-2)', fontSize: 13, marginTop: 12 }}>No JSON output</p>
        </div>
      );
    }

    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <CodeEditor
          value={isMinified ? output : formatting.formatJson(output)}
          onChange={() => {}} // Read-only
          language="json"
          height="100%"
          readOnly={true}
          lineNumbers="off"
          minimap={false}
        />
      </div>
    );
  };

  return (
    <PanelGroup direction="vertical">
      {/* Top: Structure/JSON View */}
      <Panel defaultSize={70} minSize={30} className="panel-structure">
        <div className="structure-panel">
          <div className="structure-panel__header">
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
            {rightPanelView === 'layers' ? renderLayersContent() : renderJsonContent()}
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="resize-handle resize-handle--horizontal" />

      {/* Bottom: Component Mode Settings */}
      <Panel defaultSize={30} minSize={20} maxSize={60} className="panel-component-mode">
        <ComponentMode output={output} componentInternals={componentInternals} />
      </Panel>
    </PanelGroup>
  );
};

export default RightPanel;
