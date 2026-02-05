import { generateId } from '@lib/bricks';
import { getElementLabel } from '@lib/bricks';
import { matchCSSSelectorsPerClass, parseCssDeclarations } from '@generator/utils/cssParser';
import { getLinkSettings } from '@generator/elementProcessors/linkUtils';
import { processAttributes } from '@generator/elementProcessors/attributeProcessor';

/**
 * Processes CSS classes for an element and creates global classes
 * @param {Node} node - DOM node
 * @param {Object} options - { cssRulesMap, globalClasses, variables }
 * @returns {Array} Array of global class IDs
 */
const processElementClasses = (node, options) => {
  const { cssRulesMap, globalClasses, variables } = options;

  if (!cssRulesMap || !node.classList || node.classList.length === 0) {
    return [];
  }

  const existingClasses = Array.from(node.classList);
  const perClassMatch = matchCSSSelectorsPerClass(node, cssRulesMap, existingClasses);
  const { propertiesByClass, commonProperties } = perClassMatch;

  const cssGlobalClassIds = [];

  existingClasses.forEach((cls, index) => {
    let targetClass = globalClasses.find(c => c.name === cls);
    if (!targetClass) {
      targetClass = { id: generateId(), name: cls, settings: {} };
      globalClasses.push(targetClass);
    }

    // Get class-specific properties
    const classProperties = propertiesByClass[cls] || {};

    // For the first class, also include common properties
    const propertiesToAssign = index === 0
      ? { ...commonProperties, ...classProperties }
      : classProperties;

    if (Object.keys(propertiesToAssign).length > 0) {
      const parsedSettings = parseCssDeclarations(propertiesToAssign, cls, variables);
      Object.assign(targetClass.settings, parsedSettings);
    }

    if (!cssGlobalClassIds.includes(targetClass.id)) {
      cssGlobalClassIds.push(targetClass.id);
    }
  });

  return cssGlobalClassIds;
};

/**
 * Processes navigation elements into Bricks nested nav components
 * @param {Node} node - The DOM node to process
 * @param {Object} options - { context, cssRulesMap, globalClasses, variables }
 * @returns {Array} Array of processed elements
 */
export const processNavElement = (node, options = {}) => {
  const { context = {}, cssRulesMap, globalClasses, variables } = options;
  const elements = []; // Array to collect all elements

  // Process CSS for the nav element itself
  const navGlobalClassIds = processElementClasses(node, options);

  const navElement = {
    id: generateId(),
    name: 'nav-nested',
    parent: '0',
    children: [],
    label: getElementLabel(node, 'Navigation', context),
    settings: {
      dropdownPadding: {
        top: '12',
        right: '12',
        bottom: '12',
        left: '12'
      },
      'dropdownItemBackground:hover': {
        hex: '#398378',
        rgb: 'rgba(57, 131, 120, 0.1)',
        hsl: 'hsla(171, 39%, 37%, 0.1)'
      }
    },
    themeStyles: {}
  };

  // Assign global classes to nav element
  if (navGlobalClassIds.length > 0) {
    navElement.settings._cssGlobalClasses = navGlobalClassIds;
  }

  elements.push(navElement);

  // Process nav items
  const itemsBlock = {
    id: generateId(),
    name: 'block',
    parent: navElement.id,
    children: [],
    settings: {
      tag: 'ul',
      _hidden: {
        _cssClasses: 'brx-nav-nested-items'
      }
    },
    label: 'Nav items',
    cloneable: false,
    deletable: false
  };

  elements.push(itemsBlock);

  // Process regular links (not dropdown toggles)
  const regularLinks = Array.from(node.querySelectorAll('a:not(.dropdown-toggle):not([data-toggle="dropdown"])'));
  regularLinks.forEach(link => {
    if (!link.closest('.dropdown-menu, .dropdown-content')) {
      // Process CSS for link element
      const linkGlobalClassIds = processElementClasses(link, options);

      const linkElement = {
        id: generateId(),
        name: 'text-link',
        parent: itemsBlock.id,
        children: [],
        settings: {
          text: link.textContent.trim(),
          link: getLinkSettings(link)
        },
        label: 'Nav link'
      };
      processAttributes(link, linkElement, 'a', options);

      // Assign global classes to link element
      if (linkGlobalClassIds.length > 0) {
        linkElement.settings._cssGlobalClasses = linkGlobalClassIds;
      }

      itemsBlock.children.push(linkElement.id);
      elements.push(linkElement);
    }
  });

  // Process dropdowns
  const dropdowns = Array.from(node.querySelectorAll('.dropdown, .has-dropdown, [data-toggle="dropdown"]'));
  dropdowns.forEach(dropdown => {
    const dropdownElement = {
      id: generateId(),
      name: 'dropdown',
      parent: itemsBlock.id,
      children: [],
      settings: {
        text: dropdown.querySelector('.dropdown-toggle, a')?.textContent.trim() || 'Dropdown'
      },
      label: 'Dropdown'
    };

    elements.push(dropdownElement);

    const dropdownContent = {
      id: generateId(),
      name: 'div',
      parent: dropdownElement.id,
      children: [],
      settings: {
        _hidden: {
          _cssClasses: 'brx-dropdown-content'
        },
        tag: 'ul'
      },
      label: 'Content',
      cloneable: false,
      deletable: false
    };

    elements.push(dropdownContent);

    // Process dropdown links
    const dropdownLinks = Array.from(dropdown.querySelectorAll('.dropdown-menu a, .dropdown-content a'));
    dropdownLinks.forEach(link => {
      // Process CSS for dropdown link
      const linkGlobalClassIds = processElementClasses(link, options);

      const linkElement = {
        id: generateId(),
        name: 'text-link',
        parent: dropdownContent.id,
        children: [],
        settings: {
          text: link.textContent.trim(),
          link: getLinkSettings(link)
        },
        label: 'Nav link'
      };
      processAttributes(link, linkElement, 'a', options);

      // Assign global classes
      if (linkGlobalClassIds.length > 0) {
        linkElement.settings._cssGlobalClasses = linkGlobalClassIds;
      }

      dropdownContent.children.push(linkElement.id);
      elements.push(linkElement);
    });

    dropdownElement.children.push(dropdownContent.id);
    itemsBlock.children.push(dropdownElement.id);
  });

  // Add mobile toggle elements
  const closeToggle = {
    id: generateId(),
    name: 'toggle',
    parent: itemsBlock.id,
    children: [],
    settings: {
      _hidden: {
        _cssClasses: 'brx-toggle-div'
      }
    },
    label: 'Toggle (Close: Mobile)',
  };

  const openToggle = {
    id: generateId(),
    name: 'toggle',
    parent: navElement.id,
    children: [],
    settings: {},
    label: 'Toggle (Open: Mobile)'
  };

  elements.push(closeToggle);
  elements.push(openToggle);

  itemsBlock.children.push(closeToggle.id);
  navElement.children.push(itemsBlock.id, openToggle.id);

  return elements;
};
