import { useCallback } from 'react';
import prettier from 'prettier/standalone';
import * as parserHtml from 'prettier/parser-html';
import * as parserCss from 'prettier/parser-postcss';
import * as parserBabel from 'prettier/parser-babel';
import { logger } from '@lib/logger';

/**
 * Custom hook for code formatting functionality
 * Handles formatting for HTML, CSS, and JavaScript using Prettier
 */
export const useCodeFormatting = () => {
    const formatCode = useCallback(async (code, parser) => {
        if (!code || typeof code !== 'string') return code;

        try {
            let options;

            if (parser === 'html') {
                options = {
                    parser: 'html',
                    plugins: [parserHtml],
                    printWidth: 80,
                    tabWidth: 2,
                    useTabs: false,
                    htmlWhitespaceSensitivity: 'css',
                    endOfLine: 'auto',
                };
            } else if (parser === 'css') {
                options = {
                    parser: 'css',
                    plugins: [parserCss],
                    printWidth: 80,
                    tabWidth: 2,
                    useTabs: false,
                    singleQuote: true,
                    endOfLine: 'auto',
                };
            } else if (parser === 'babel') {
                options = {
                    parser: 'babel',
                    plugins: [parserBabel],
                    printWidth: 80,
                    tabWidth: 2,
                    useTabs: false,
                    singleQuote: true,
                    semi: true,
                    trailingComma: 'es5',
                    bracketSpacing: true,
                    arrowParens: 'avoid',
                    endOfLine: 'auto',
                };
            }

            const formatted = await prettier.format(code, options);
            return formatted;
        } catch (error) {
            logger.error(`Error formatting code`, {
                file: 'useCodeFormatting.js',
                step: 'formatCode',
                feature: parser.toUpperCase()
            }, error);
            return code;
        }
    }, []);

    const formatCurrent = useCallback(async (activeTab, html, css, js, setHtml, setCss, setJs) => {
        try {
            if (activeTab === 'html' && html) {
                const formatted = await formatCode(html, 'html');
                setHtml(formatted);
            } else if (activeTab === 'css' && css) {
                const formatted = await formatCode(css, 'css');
                setCss(formatted);
            } else if (activeTab === 'js' && js) {
                const formatted = await formatCode(js, 'babel');
                setJs(formatted);
            }
        } catch (error) {
            logger.error('Failed to format code', {
                file: 'useCodeFormatting.js',
                step: 'formatCurrent',
                feature: activeTab?.toUpperCase() || 'Unknown'
            }, error);
        }
    }, [formatCode]);

    const formatJson = useCallback((jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return jsonString; // Return as-is if parsing fails
        }
    }, []);

    return {
        formatCode,
        formatCurrent,
        formatJson
    };
};
