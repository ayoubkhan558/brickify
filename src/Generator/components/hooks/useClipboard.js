import { useState, useCallback } from 'react';
import { logger } from '@lib/logger';

/**
 * Strips internal Brickify fields that are not part of the Bricks paste format.
 * These fields are used by the UI (layers, property handlers) but must not
 * be included in the clipboard output sent to Bricks.
 */
const stripInternalFields = (jsonString) => {
    try {
        const parsed = JSON.parse(jsonString);
        delete parsed.rawContent;
        delete parsed.idMappings;
        return JSON.stringify(parsed);
    } catch {
        return jsonString; // Not valid JSON, return as-is
    }
};

/**
 * Custom hook for clipboard operations
 * Handles copying text to clipboard with feedback
 */
export const useClipboard = () => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = useCallback(async (text) => {
        if (!text) return false;

        try {
            const cleanText = stripInternalFields(text);
            await navigator.clipboard.writeText(cleanText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            return true;
        } catch (err) {
            logger.error('Failed to copy text', {
                file: 'useClipboard.js',
                step: 'copyToClipboard',
                feature: 'Clipboard API'
            }, err);
            return false;
        }
    }, []);

    const handleCopyJson = useCallback(async (output) => {
        if (!output) return;
        try {
            const cleanOutput = stripInternalFields(output);
            await navigator.clipboard.writeText(cleanOutput);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
        } catch (err) {
            logger.error('Failed to copy JSON to clipboard', {
                file: 'useClipboard.js',
                step: 'handleCopyJson',
                feature: 'JSON Export'
            }, err);
        }
    }, []);

    const handleExportJson = useCallback((output) => {
        if (!output) return;
        try {
            const cleanOutput = stripInternalFields(output);
            const blob = new Blob([cleanOutput], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bricks-structure-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Failed to export JSON file', {
                file: 'useClipboard.js',
                step: 'handleExportJson',
                feature: 'File Download'
            }, err);
        }
    }, []);

    return {
        isCopied,
        copyToClipboard,
        handleCopyJson,
        handleExportJson,
        setIsCopied
    };
};
