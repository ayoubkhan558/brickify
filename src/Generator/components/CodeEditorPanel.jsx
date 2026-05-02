import React from 'react';
import { RiJavascriptLine, RiHtml5Line } from 'react-icons/ri';
import { FaCss3 } from 'react-icons/fa6';
import Tooltip from '@components/Tooltip';
import CodeEditor from '@generator/CodeEditor';

/**
 * Left-panel code editor area.
 * Renders the HTML / CSS / JS tab bar, Correct & Format action buttons,
 * the Monaco editor, and the Quick Action Tags strip.
 */
const CodeEditorPanel = ({
  // Tab state
  activeTab,
  setActiveTab,
  // Code values & setters
  html,
  css,
  js,
  handleHtmlChange,
  setCss,
  setJs,
  // Action handlers
  handleCorrectCode,
  formatting,
  // Cursor tracking
  setActiveTagIndex,
}) => {
  const currentValue = activeTab === 'html' ? html : activeTab === 'css' ? css : js;
  const currentOnChange = activeTab === 'html' ? handleHtmlChange : activeTab === 'css' ? setCss : setJs;

  const placeholder =
    activeTab === 'html'
      ? `<!-- Your HTML here… -->\n\n<section>\n  <h1>My First Heading</h1>\n  <p>My first paragraph.</p>\n</section>`
      : activeTab === 'css'
      ? '/* Your CSS here… */'
      : '// Your JavaScript here…';

  return (
    <div className="code-editor">
      {/* ── Tab Bar + Action Buttons ── */}
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
          {/* Correct — only meaningful on the HTML tab */}
          <button
            className="code-editor__action"
            onClick={(e) => {
              e.stopPropagation();
              handleCorrectCode();
            }}
            data-tooltip-id="correct-tooltip"
            data-tooltip-content="Strip structural tags (<html>/<head>/<body>) and move <style>/<script> to their tabs"
          >
            Correct
          </button>
          <Tooltip id="correct-tooltip" place="top" effect="solid" />

          {/* Format — works on all three tabs */}
          <button
            className="code-editor__action"
            onClick={(e) => {
              e.stopPropagation();
              formatting.formatCurrent(activeTab, html, css, js, handleHtmlChange, setCss, setJs);
            }}
            data-tooltip-id="format-tooltip"
            data-tooltip-content="Auto Format & indent code"
          >
            Format
          </button>
          <Tooltip id="format-tooltip" place="top" effect="solid" />
        </div>
      </div>

      {/* ── Monaco Editor ── */}
      <div className="code-editor__content">
        <div className="code-editor__pane active">
          <CodeEditor
            value={currentValue}
            onChange={currentOnChange}
            language={activeTab}
            placeholder={placeholder}
            height="100%"
            className="code-editor__content"
            onCursorTagIndexChange={setActiveTagIndex}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPanel;
