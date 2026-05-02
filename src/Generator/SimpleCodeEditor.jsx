import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';

const SimpleCodeEditor = ({
    value,
    onChange,
    language = 'html',
    placeholder = '',
    className = '',
    height = '100%',
    readOnly = false,
}) => {
    // Map language to Prism language
    const getPrismLanguage = (lang) => {
        switch (lang) {
            case 'html':
                return languages.markup;
            case 'css':
                return languages.css;
            case 'javascript':
            case 'js':
                return languages.javascript;
            default:
                return languages.markup;
        }
    };

    const highlightCode = (code) => {
        try {
            return highlight(code, getPrismLanguage(language), language === 'html' ? 'markup' : language);
        } catch {
            return code;
        }
    };

    return (
        <div className={`simple-code-editor ${className}`} style={{ height, overflow: 'auto' }}>
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={highlightCode}
                padding={10}
                disabled={readOnly}
                placeholder={placeholder}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: height,
                    backgroundColor: '#1e1e1e',
                    color: '#d4d4d4',
                }}
                textareaClassName="code-textarea"
            />
        </div>
    );
};

export default SimpleCodeEditor;
