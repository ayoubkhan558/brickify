import { useState, useEffect } from 'react';
import { logger } from '@lib/logger';
import { stripAndExtract } from '../../utils/htmlInputProcessor';

/**
 * Custom hook for AI code generation functionality
 * Handles API key management, provider selection, and quick generation
 * @param {Object} aiTemplates - AI templates hook for getting enabled templates
 */
export const useAIGeneration = (activeTab, html, css, js, setHtml, setCss, setJs, aiTemplates = null) => {
    const [isQuickGenerating, setIsQuickGenerating] = useState(false);
    const [quickError, setQuickError] = useState(null);
    const [quickPrompt, setQuickPrompt] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [apiKeys, setApiKeys] = useState({
        gemini: '',
        openrouter: '',
        openai: ''
    });
    const [currentProvider, setCurrentProvider] = useState('gemini');
    const [selectedQuickModel, setSelectedQuickModel] = useState('');
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);

    // Check for API key on mount and when settings close
    useEffect(() => {
        const checkApiKeys = () => {
            const keys = {
                gemini: localStorage.getItem('ai_api_key_gemini') || '',
                openrouter: localStorage.getItem('ai_api_key_openrouter') || '',
                openai: localStorage.getItem('ai_api_key_openai') || ''
            };

            setApiKeys(keys);

            const provider = localStorage.getItem('ai_provider') || 'gemini';
            const model = localStorage.getItem('ai_model');

            setCurrentProvider(provider);
            setHasApiKey(!!keys[provider]);

            // Set selected model from localStorage or default
            if (model) {
                setSelectedQuickModel(model);
            } else {
                const defaultModel = provider === 'gemini' ? 'gemini-2.5-flash' :
                    provider === 'openrouter' ? 'google/gemini-2.0-flash-exp:free' :
                        'gpt-4o-mini';
                setSelectedQuickModel(defaultModel);
            }
        };

        checkApiKeys();

        // Re-check when component mounts or settings modal state changes
        if (!isAISettingsOpen) {
            checkApiKeys();
        }
    }, [isAISettingsOpen]);

    const handleAICodeGenerated = (generatedCode) => {
        if (generatedCode.html) setHtml(generatedCode.html);
        if (generatedCode.css) setCss(generatedCode.css);
        if (generatedCode.js) setJs(generatedCode.js);
    };

    const handleQuickGenerate = async () => {
        // Check if we have either a prompt OR enabled templates
        const hasEnabledTemplates = aiTemplates && aiTemplates.getEnabledTemplates().length > 0;
        const hasPrompt = quickPrompt.trim();

        if (!hasPrompt && !hasEnabledTemplates) {
            setQuickError('Please enter a prompt or enable at least one template.');
            setTimeout(() => setQuickError(null), 3000);
            return;
        }

        if (isQuickGenerating) return;

        // Get the API key for the current provider
        const currentApiKey = apiKeys[currentProvider];
        if (!currentApiKey) {
            setQuickError('Please set your AI API key in settings first.');
            setTimeout(() => setQuickError(null), 3000);
            return;
        }

        setIsQuickGenerating(true);
        setQuickError(null);

        try {
            // Temporarily save the selected model to localStorage for this request
            const originalModel = localStorage.getItem('ai_model');
            localStorage.setItem('ai_model', selectedQuickModel);

            const { aiService } = await import('@services/ai');

            // Build context based on active tab and existing code
            const currentCode = activeTab === 'html' ? html : activeTab === 'css' ? css : js;
            const hasExistingCode = currentCode.trim();

            // Detect if user is requesting multiple file types
            const userPromptLower = quickPrompt.toLowerCase();
            const requestsMultipleFiles =
                userPromptLower.includes('html') && userPromptLower.includes('css') ||
                userPromptLower.includes('html and css') ||
                userPromptLower.includes('html + css') ||
                userPromptLower.includes('html, css') ||
                (activeTab === 'html' && !hasExistingCode && (
                    userPromptLower.includes('create') ||
                    userPromptLower.includes('build') ||
                    userPromptLower.includes('make') ||
                    userPromptLower.includes('design') ||
                    userPromptLower.includes('section') ||
                    userPromptLower.includes('component') ||
                    userPromptLower.includes('page')
                ));

            let systemPrompt = `You are an expert web developer. Generate clean, modern code based on the user's request.

⚠️ ABSOLUTE CRITICAL RULES - NEVER VIOLATE THESE:

1. HTML STRUCTURE - FORBIDDEN TAGS:
   ❌ NEVER EVER include: <!DOCTYPE html>, <html>, <head>, <body>, <meta>, <title>, <link>
   ❌ These tags are COMPLETELY FORBIDDEN in your response
   ✅ Start DIRECTLY with the component content (e.g., <div>, <section>, <header>)
   ✅ Return ONLY the inner content that would go inside a <body> tag

2. CSS RULES - FORBIDDEN SELECTORS:
   ❌ NEVER style the <body> tag - it doesn't exist in this context
   ❌ NEVER include CSS resets for *, html, or body
   ❌ Do NOT wrap CSS in <style> tags
   ✅ Style ONLY the component elements you create
   ✅ Start with the main container class/element

3. NO EXPLANATIONS:
   ❌ Do NOT add any explanatory text, comments, or notes
   ❌ Do NOT say "here's the code" or similar phrases
   ✅ Return ONLY the code itself`;

            if (requestsMultipleFiles) {
                systemPrompt += `

4. MULTI-FILE FORMAT:
   ✅ Return BOTH HTML and CSS in this EXACT JSON format:
      {
        "html": "your HTML code here",
        "css": "your CSS code here"
      }
   ❌ Do NOT include any text outside the JSON object
   ✅ Ensure CSS styles ALL elements in the HTML completely
   ✅ Use modern, professional styling with proper spacing and colors`;
            } else {
                systemPrompt += `

4. SINGLE FILE FORMAT:
   ✅ Return ONLY raw ${activeTab.toUpperCase()} code
   ❌ Do NOT return JSON objects
   ❌ Do NOT wrap JavaScript in <script> tags`;
            }

            systemPrompt += `

5. CODE QUALITY:
   ✅ Use proper formatting and indentation
   ✅ For updates, return the COMPLETE updated code
   ${hasExistingCode ? `✅ PRESERVE the existing code structure - only update/refactor as requested\n   ❌ Do NOT delete or clear existing code unless explicitly asked` : ''}

REMEMBER: You are generating a COMPONENT, not a full webpage. No document structure tags allowed!`;

            // Add template requirements if templates are enabled
            if (aiTemplates && aiTemplates.getEnabledTemplates().length > 0) {
                const templatePrompts = aiTemplates.getCombinedPrompt();
                systemPrompt += `\n\n${templatePrompts}`;
            }

            // Add design systems if available - extract variable names from all uploaded JSONs
            const designSystemsData = localStorage.getItem('ai_design_systems');
            if (designSystemsData) {
                try {
                    const systems = JSON.parse(designSystemsData);
                    if (systems && systems.length > 0) {
                        let dsPrompt = '\n\nDESIGN SYSTEM CONSTRAINTS:\nUse ONLY the following variable names from your Bricks design system:\n';

                        systems.forEach((system, index) => {
                            const ds = system.data;
                            dsPrompt += `\n--- From ${system.filename} ---\n`;

                            if (ds.colors) {
                                const colorNames = Object.keys(ds.colors);
                                dsPrompt += `\nColor Variables: ${colorNames.join(', ')}`;
                            }
                            if (ds.typography) {
                                const typoNames = Object.keys(ds.typography);
                                dsPrompt += `\nTypography Variables: ${typoNames.join(', ')}`;
                            }
                            if (ds.spacing) {
                                const spacingNames = Object.keys(ds.spacing);
                                dsPrompt += `\nSpacing Variables: ${spacingNames.join(', ')}`;
                            }
                            if (ds.variables) {
                                const varNames = Object.keys(ds.variables);
                                dsPrompt += `\nCSS Variables: ${varNames.join(', ')}`;
                            }
                            if (ds.classes && Array.isArray(ds.classes)) {
                                dsPrompt += `\nUtility Classes: ${ds.classes.join(', ')}`;
                            }
                        });

                        dsPrompt += '\n\nIMPORTANT: Use EXACTLY these variable names. Do not create new variable names.';
                        systemPrompt += dsPrompt;
                    }
                } catch (e) {
                    // Silently fail if design systems are invalid
                }
            }

            if (hasExistingCode) {
                systemPrompt += `

          CURRENT ${activeTab.toUpperCase()} CODE:
          \`\`\`${activeTab}
          ${currentCode}
          \`\`\``;
            }


            // Configure AI service
            aiService.configure(currentProvider, currentApiKey, selectedQuickModel);

            // Check if we're using naming templates (BEM, OOCSS, Semantic) - these affect both HTML and CSS
            const namingTemplates = aiTemplates?.getEnabledTemplates().filter(t =>
                t.category === 'naming'
            ) || [];
            const isUsingNamingTemplates = namingTemplates.length > 0;

            // Build user prompt with existing code context
            let userPrompt = quickPrompt.trim();

            if (!userPrompt) {
                // No user prompt - use default based on whether code exists
                if (hasExistingCode) {
                    if (isUsingNamingTemplates && (html.trim() || css.trim())) {
                        // For naming templates, request both HTML and CSS updates
                        userPrompt = `I have HTML and CSS code that needs to be refactored according to the naming template guidelines (e.g., BEM, OOCSS). Please update BOTH the HTML classes AND the corresponding CSS selectors while preserving all existing content and structure.

Return your response in this exact JSON format:
{
  "html": "updated HTML code here",
  "css": "updated CSS code here"
}

Current HTML:
\`\`\`html
${html}
\`\`\`

Current CSS:
\`\`\`css
${css}
\`\`\``;
                    } else {
                        // Single tab update
                        userPrompt = `I have the following ${activeTab.toUpperCase()} code that needs to be refactored according to the template guidelines provided in the system prompt. Please update the code while preserving all existing content and structure:

\`\`\`${activeTab}
${currentCode}
\`\`\``;
                    }
                } else {
                    userPrompt = 'Generate code following the selected template guidelines.';
                }
            } else if (hasExistingCode) {
                // User provided prompt - append existing code for context
                userPrompt += `

Current ${activeTab.toUpperCase()} code:
\`\`\`${activeTab}
${currentCode}
\`\`\``;
            }

            // Generate code
            const response = await aiService.generate(userPrompt, {
                systemPrompt
            });


            // Extract text from response (handle multiple API response formats)
            let responseText = '';

            if (typeof response === 'string') {
                // Simple string response
                responseText = response;
            } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                // Gemini API format: {candidates: [{content: {parts: [{text: "..."}]}}]}
                responseText = response.candidates[0].content.parts[0].text;
            } else if (response?.text) {
                // OpenAI/OpenRouter format: {text: "..."}
                responseText = response.text;
            } else if (response?.content) {
                // Alternative format: {content: "..."}
                responseText = response.content;
            } else {
                // Fallback: try to stringify and extract
                responseText = JSON.stringify(response);
            }

            if (!responseText || !responseText.trim()) {
                throw new Error('AI returned empty response');
            }

            // Clean the response
            let cleanedCode = responseText.trim();

            // Remove markdown code blocks if present (do this FIRST)
            const codeBlockRegex = /^```(?:json)?\n?([\s\S]*?)\n?```$/;
            const match = cleanedCode.match(codeBlockRegex);
            if (match) {
                cleanedCode = match[1].trim();
            }

            // Helper function to clean HTML - remove forbidden tags
            const cleanHTML = (html) => {
                let cleaned = html;

                // Remove DOCTYPE
                cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');

                // Remove opening and closing html, head, body tags
                cleaned = cleaned.replace(/<\/?html[^>]*>/gi, '');
                cleaned = cleaned.replace(/<\/?head[^>]*>/gi, '');
                cleaned = cleaned.replace(/<\/?body[^>]*>/gi, '');

                // Remove meta, title, link tags (complete tags)
                cleaned = cleaned.replace(/<meta[^>]*>/gi, '');
                cleaned = cleaned.replace(/<title[^>]*>.*?<\/title>/gi, '');
                cleaned = cleaned.replace(/<link[^>]*>/gi, '');

                return cleaned.trim();
            };

            // Helper function to clean CSS - remove forbidden selectors
            const cleanCSS = (css) => {
                let cleaned = css;

                // Remove body styles (including nested rules)
                cleaned = cleaned.replace(/body\s*{[^}]*}/gi, '');

                // Remove universal reset rules
                cleaned = cleaned.replace(/\*\s*,?\s*\*::before\s*,?\s*\*::after\s*{[^}]*}/gi, '');
                cleaned = cleaned.replace(/\*\s*{[^}]*}/gi, '');

                // Remove html styles
                cleaned = cleaned.replace(/html\s*{[^}]*}/gi, '');

                // Remove common reset comments
                cleaned = cleaned.replace(/\/\*\s*General Reset.*?\*\//gi, '');
                cleaned = cleaned.replace(/\/\*\s*Base Styles.*?\*\//gi, '');

                return cleaned.trim();
            };

            // Check if AI returned JSON object with multiple files
            let parsedMultiFile = null;
            if (cleanedCode.startsWith('{') && (cleanedCode.includes('"html"') || cleanedCode.includes('"css"') || cleanedCode.includes('"js"'))) {
                try {
                    parsedMultiFile = JSON.parse(cleanedCode);
                } catch (e) {
                    // Not valid JSON, will handle as single file below
                }
            }

            // If we successfully parsed multi-file JSON, apply all files
            if (parsedMultiFile) {
                if (parsedMultiFile.html) {
                    // Process HTML to strip structural tags and extract styles/scripts
                    const processed = stripAndExtract(cleanHTML(parsedMultiFile.html));
                    setHtml(processed.bodyContent);
                    
                    // Append extracted CSS if any
                    if (processed.extractedCss) {
                        setCss(prevCss => {
                            const existingCss = prevCss.trim();
                            return existingCss ? `${existingCss}\n\n/* Extracted from AI-generated <style> tags */\n${processed.extractedCss}` : processed.extractedCss;
                        });
                    }
                    
                    // Append extracted JS if any
                    if (processed.extractedJs) {
                        setJs(prevJs => {
                            const existingJs = prevJs.trim();
                            return existingJs ? `${existingJs}\n\n// Extracted from AI-generated <script> tags\n${processed.extractedJs}` : processed.extractedJs;
                        });
                    }
                }
                if (parsedMultiFile.css) {
                    setCss(cleanCSS(parsedMultiFile.css));
                }
                if (parsedMultiFile.js) {
                    setJs(parsedMultiFile.js);
                }
            } else {
                // Single file response - apply to active tab
                if (activeTab === 'html') {
                    // Process HTML to strip structural tags and extract styles/scripts
                    const processed = stripAndExtract(cleanHTML(cleanedCode));
                    setHtml(processed.bodyContent);
                    
                    // Append extracted CSS if any
                    if (processed.extractedCss) {
                        setCss(prevCss => {
                            const existingCss = prevCss.trim();
                            return existingCss ? `${existingCss}\n\n/* Extracted from AI-generated <style> tags */\n${processed.extractedCss}` : processed.extractedCss;
                        });
                    }
                    
                    // Append extracted JS if any
                    if (processed.extractedJs) {
                        setJs(prevJs => {
                            const existingJs = prevJs.trim();
                            return existingJs ? `${existingJs}\n\n// Extracted from AI-generated <script> tags\n${processed.extractedJs}` : processed.extractedJs;
                        });
                    }
                } else if (activeTab === 'css') {
                    setCss(cleanCSS(cleanedCode));
                } else if (activeTab === 'js') {
                    setJs(cleanedCode);
                }
            }

            setQuickPrompt('');

            // Restore original model
            if (originalModel) {
                localStorage.setItem('ai_model', originalModel);
            }
        } catch (error) {
            logger.error('AI code generation failed', {
                file: 'useAIGeneration.js',
                step: 'handleQuickGenerate',
                feature: `AI - ${activeTab?.toUpperCase() || 'Unknown'}`
            }, error);
            setQuickError(error.message || 'Failed to generate code. Please try again.');
        } finally {
            setIsQuickGenerating(false);
        }
    };

    return {
        // State
        isQuickGenerating,
        quickError,
        quickPrompt,
        hasApiKey,
        apiKeys,
        currentProvider,
        selectedQuickModel,
        isAISettingsOpen,

        // Setters
        setQuickPrompt,
        setSelectedQuickModel,
        setIsAISettingsOpen,

        // Handlers
        handleAICodeGenerated,
        handleQuickGenerate
    };
};
