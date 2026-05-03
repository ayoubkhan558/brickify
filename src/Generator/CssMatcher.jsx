import React, { useState, useMemo, useCallback } from 'react';
import * as csstree from 'css-tree';
import logger from '@lib/logger';

const CSSHTMLAnalyzer = () => {
  const [htmlInput, setHtmlInput] = useState(`
    <div class="container">
      <h1 id="title" class="main-title special" data-role="heading" aria-label="Main Title">
        Title
      </h1>
      <p class="text">Sample text</p>
    </div>
`);

  const [cssInput, setCssInput] = useState(`
    /* Container styling */
    .container {
      padding: 20px;
    }

    /* 1. ID selector */
    #title {
      color: blue;
    }

    /* 2. Single class selector */
    .main-title {
      font-size: 32px;
    }

    /* 3. ID + class combination */
    h1#title.main-title {
      background: yellow;
    }

    /* 4. Attribute selector */
    h1[data-role="heading"] {
      padding: 10px;
    }

    /* 5. Type selector */
    h1 {
      text-transform: uppercase;
    }

    /* 6. Descendant selector */
    .container h1 {
      border-bottom: 2px solid black;
    }

    /* 7. Attribute existence selector */
    *[aria-label] {
      margin-bottom: 20px;
    }

    /* Original provided selectors for other elements */
    .text {
      font-size: 16px;
    }

    .container .text {
      line-height: 1.5;
    }

    p {
      background-color: lightgray;
    }

    .non-existent {
      color: red;
    }

`);

  // Use css-tree for proper CSS parsing
  const parseCSS = (cssString) => {
    const selectors = [];

    try {
      const ast = csstree.parse(cssString, {
        parseCustomProperty: true,
        parseValue: true
      });

      csstree.walk(ast, {
        visit: 'Rule',
        enter(node) {
          const selector = csstree.generate(node.prelude);
          const declarations = [];

          if (node.block && node.block.children) {
            node.block.children.forEach(child => {
              if (child.type === 'Declaration') {
                const property = child.property;
                const value = csstree.generate(child.value);
                declarations.push(`${property}: ${value}`);
              }
            });
          }

          const properties = declarations.join('; ');
          selectors.push({ selector, properties });
        }
      });
    } catch (error) {
      logger.warn('CSS parsing error:', error);
    }

    return selectors;
  };

  const parseProperties = (propertiesString) => {
    const properties = {};
    const declarations = propertiesString.split(';').filter(decl => decl.trim());

    declarations.forEach(decl => {
      const [property, value] = decl.split(':').map(part => part.trim());
      if (property && value) {
        properties[property] = value;
      }
    });

    return properties;
  };

  const analyzeElements = useCallback(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, 'text/html');
      const selectors = parseCSS(cssInput);

      // Get all elements from the HTML
      const allElements = doc.querySelectorAll('*');
      const elementAnalysis = [];

      Array.from(allElements).forEach(element => {
        const elementInfo = {
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          className: element.className || null,
          textContent: element.textContent?.trim(),
          appliedStyles: {},
          matchingSelectors: []
        };

        // Check which selectors match this element
        selectors.forEach(({ selector, properties }) => {
          try {
            if (element.matches(selector)) {
              elementInfo.matchingSelectors.push(selector);
              const parsedProperties = parseProperties(properties);

              // Merge properties (later selectors override earlier ones)
              Object.assign(elementInfo.appliedStyles, parsedProperties);
            }
          } catch {
            // Invalid selector, skip it
          }
        });

        // Only include elements that have matching CSS rules
        if (elementInfo.matchingSelectors.length > 0) {
          elementAnalysis.push(elementInfo);
        }
      });

      return elementAnalysis;
    } catch (error) {
      logger.error('Analysis error:', error);
      return [];
    }
  }, [htmlInput, cssInput]);

  const analysis = useMemo(() => analyzeElements(), [analyzeElements]);

  const styles = {
    container: {
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      color: '#000'
    },
    title: {
      fontSize: '24px',
      marginBottom: '20px',
      color: '#000'
    },
    inputContainer: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px'
    },
    inputGroup: {
      flex: 1
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold'
    },
    textarea: {
      width: '100%',
      height: '200px',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      resize: 'vertical'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginBottom: '20px'
    },
    resultContainer: {
      marginTop: '20px'
    },
    elementItem: {
      border: '1px solid #28a745',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '15px',
      backgroundColor: '#f8f9fa'
    },
    elementHeader: {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#333'
    },
    textContent: {
      fontSize: '12px',
      color: '#666',
      marginBottom: '10px',
      fontStyle: 'italic'
    },
    selectorsSection: {
      marginBottom: '15px'
    },
    selectorsList: {
      fontSize: '12px',
      color: '#666',
      marginTop: '5px'
    },
    selectorCode: {
      fontFamily: 'monospace',
      backgroundColor: '#e9ecef',
      padding: '2px 4px',
      borderRadius: '2px',
      margin: '2px'
    },
    propertiesSection: {
      marginTop: '15px'
    },
    propertiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '8px',
      marginTop: '10px'
    },
    propertyItem: {
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      padding: '8px',
      fontSize: '12px',
      fontFamily: 'monospace'
    },
    propertyName: {
      fontWeight: 'bold',
      color: '#0056b3'
    },
    propertyValue: {
      color: '#d63384'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>CSS-HTML Analyzer</h1>

      <div style={styles.inputContainer}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>HTML:</label>
          <textarea
            style={styles.textarea}
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            placeholder="Enter HTML..."
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>CSS:</label>
          <textarea
            style={styles.textarea}
            value={cssInput}
            onChange={(e) => setCssInput(e.target.value)}
            placeholder="Enter CSS..."
          />
        </div>
      </div>

      <button style={styles.button} onClick={analyzeElements}>
        Analyze
      </button>

      <div style={styles.resultContainer}>
        <h2>Elements with Applied Styles:</h2>
        {analysis.length === 0 ? (
          <p>No elements with matching CSS rules found.</p>
        ) : (
          analysis.map((element, index) => (
            <div key={index} style={styles.elementItem}>
              <div style={styles.elementHeader}>
                &lt;{element.tagName}
                {element.id && ` id="${element.id}"`}
                {element.className && ` class="${element.className}"`}
                &gt;
              </div>

              {element.textContent && (
                <div style={styles.textContent}>
                  Content: "{element.textContent}"
                </div>
              )}

              <div style={styles.selectorsSection}>
                <strong>Matched by selectors:</strong>
                <div style={styles.selectorsList}>
                  {element.matchingSelectors.map((selector, sIndex) => (
                    <span key={sIndex} style={styles.selectorCode}>
                      {selector}
                    </span>
                  ))}
                </div>
              </div>

              <div style={styles.propertiesSection}>
                <strong>Applied CSS Properties:</strong>
                <div style={styles.propertiesGrid}>
                  {Object.entries(element.appliedStyles).map(([property, value]) => (
                    <div key={property} style={styles.propertyItem}>
                      <span style={styles.propertyName}>{property}</span>
                      <span>: </span>
                      <span style={styles.propertyValue}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CSSHTMLAnalyzer;