import React, { useState, useMemo } from 'react';
import {
  BsSquare,
  BsCardHeading,
  BsTextParagraph,
  BsLayoutSplit,
  BsLayoutThreeColumns,
  BsCodeSlash,
  BsBricks,
  BsLayoutTextSidebarReverse,
  BsListUl,
  BsInputCursorText,
  BsInputCursor,
  BsMenuButtonWide,
  BsTextareaT,
  BsTag,
  BsImage,
  BsTable,
  BsLink45Deg,
  BsTypeH1,
  BsTypeH2,
  BsTypeH3,
  BsTypeH4,
  BsTypeH5,
  BsTypeH6,
  BsTypeBold,
  BsTypeItalic,
  BsClock,
  BsClockHistory,
  BsWindow,
  BsBraces,
  BsLayoutSidebarReverse
} from 'react-icons/bs';
import { GrCursor } from "react-icons/gr";
import { RxSection } from "react-icons/rx";
import { CgDisplayFullwidth } from "react-icons/cg";
import { MdOutlineWidthFull } from "react-icons/md";

import { CiBoxList } from "react-icons/ci";
import { FaWpforms } from "react-icons/fa6";
import { TbSvg } from "react-icons/tb";
import { IoLogoJavascript } from "react-icons/io";
import { IoText } from "react-icons/io5";
import { DiMarkdown } from "react-icons/di";
import { IoIosLink } from "react-icons/io";
import { RxButton } from "react-icons/rx";
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { FaPlug } from 'react-icons/fa6';
import { useGenerator } from '@contexts/GeneratorContext';
import './StructureView.scss';


const ICONS = {
  // Layout & Structure
  // section: <BsLayoutSplit />,
  section: <CgDisplayFullwidth />,
  container: < MdOutlineWidthFull />,
  div: <RxSection />,
  block: <BsBricks />,
  header: <BsLayoutTextSidebarReverse />,
  footer: <BsLayoutTextSidebarReverse />,
  main: <BsLayoutSidebarReverse />,
  article: <BsLayoutTextSidebarReverse />,
  aside: <BsLayoutSidebarReverse />,
  template: <BsBricks />,
  slot: <BsBricks />,

  // Typography
  heading: <BsTypeH1 />,
  h1: <BsTypeH1 />,
  h2: <BsTypeH2 />,
  h3: <BsTypeH3 />,
  h4: <BsTypeH4 />,
  h5: <BsTypeH5 />,
  h6: <BsTypeH6 />,
  p: <BsTextParagraph />,
  span: <BsTextParagraph />,
  strong: <BsTypeBold />,
  b: <BsTypeBold />,
  i: <BsTypeItalic />,
  em: <BsTypeItalic />,
  small: <BsTextParagraph />,
  mark: <DiMarkdown />,
  label: <BsTextareaT />,
  text: <BsTextareaT />,
  'text-basic': <IoText />,

  // Lists
  ul: <CiBoxList />,
  ol: <CiBoxList />,
  li: <CiBoxList />,
  list: <CiBoxList />,

  // Navigation
  nav: <BsLayoutTextSidebarReverse />,
  menu: <BsListUl />,
  breadcrumb: <BsListUl />,

  // Forms
  form: <FaWpforms />,
  input: <FaWpforms />,
  textarea: <FaWpforms />,
  select: <FaWpforms />,
  option: <FaWpforms />,
  fieldset: <FaWpforms />,
  legend: <FaWpforms />,
  checkbox: <FaWpforms />,
  radio: <FaWpforms />,

  // Interactive
  'text-link': <IoIosLink />,
  a: <IoIosLink />,
  button: <GrCursor />,
  details: <RxButton />,
  summary: <RxButton />,

  // Media
  img: <BsImage />,
  image: <BsImage />,
  picture: <BsImage />,
  figure: <BsImage />,
  figcaption: <BsImage />,
  video: <BsImage />,
  audio: <BsImage />,
  source: <BsImage />,
  iframe: <BsImage />,

  // SVG / Canvas
  svg: <TbSvg />,
  canvas: <TbSvg />,
  path: <TbSvg />,

  // Tables
  table: <BsTable />,
  thead: <BsTable />,
  tbody: <BsTable />,
  tfoot: <BsTable />,
  tr: <BsTable />,
  th: <BsTable />,
  td: <BsTable />,
  caption: <BsTable />,

  // Semantic / Metadata
  time: <BsClock />,
  progress: <BsClockHistory />,
  meter: <BsClockHistory />,
  dialog: <BsWindow />,
  meta: <BsBricks />,
  link: <BsLink45Deg />,
  style: <BsBraces />,
  noscript: <BsBraces />,
  script: <IoLogoJavascript />,

  // Code
  code: <BsCodeSlash />,
  pre: <BsCodeSlash />,

  // Default
  default: <BsSquare />,
};

/**
 * Determines the default exposable setting key for an element type.
 */
const getExposableSettingKey = (elementName) => {
  const map = {
    heading: 'text',
    'text-basic': 'text',
    'text-link': 'text',
    image: 'image',
    button: 'text',
  };
  return map[elementName] || null;
};


const StructureView = ({ data, globalClasses, activeIndex, showNodeClass }) => {
  const {
    componentMode,
    componentAutoDetect,
    componentManualProperties,
    setComponentManualProperties,
  } = useGenerator();

  // Build a set of element IDs that are already mapped as properties
  const mappedElementIds = useMemo(() => {
    const ids = new Set();
    if (componentManualProperties) {
      componentManualProperties.forEach(mp => {
        if (mp.elementId) ids.add(mp.elementId);
      });
    }
    return ids;
  }, [componentManualProperties]);

  if (!data || data.length === 0) {
    return null;
  }

  const elementsById = data.reduce((acc, el) => {
    acc[el.id] = { ...el, children: [] };
    return acc;
  }, {});

  const roots = [];
  data.forEach(el => {
    if (el.parent && elementsById[el.parent]) {
      elementsById[el.parent].children.push(elementsById[el.id]);
    } else {
      roots.push(elementsById[el.id]);
    }
  });

  const getElementInfo = (element) => {
    const info = {
      icon: ICONS[element.name] || ICONS.default,
      label: element.name || 'div',
      className: '',
    };

    if (element.settings?._cssGlobalClasses?.length > 0) {
      const classId = element.settings._cssGlobalClasses[0];
      const globalClass = globalClasses.find(gc => gc.id === classId);
      if (globalClass) {
        info.className = `.${globalClass.name}`;
      }
    }
    return info;
  };

  const handleExposeAsProperty = (element) => {
    const settingKey = getExposableSettingKey(element.name);
    if (!settingKey) return;

    // Check if already mapped
    if (mappedElementIds.has(element.id)) {
      // Remove the mapping
      setComponentManualProperties(prev =>
        prev.filter(mp => mp.elementId !== element.id)
      );
      return;
    }

    // Generate a label from the element
    const label = (element.label || element.name)
      .replace(/__/g, ' ')
      .replace(/--/g, ' ')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();

    const defaultValue = element.settings?.[settingKey] || '';

    setComponentManualProperties(prev => [
      ...prev,
      {
        label,
        type: settingKey === 'image' ? 'image' : settingKey === 'link' ? 'link' : 'text',
        default: defaultValue,
        elementId: element.id,
        settingKey,
      }
    ]);
  };

  const TreeNode = ({ node }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children.length > 0;
    const { icon, label, className } = getElementInfo(node);
    const isActive = node._order === activeIndex;

    const isExposable = componentMode && !componentAutoDetect && getExposableSettingKey(node.name);
    const isMapped = mappedElementIds.has(node.id);

    // In auto-detect mode, check if this element type would be auto-detected
    const isAutoDetected = componentMode && componentAutoDetect && getExposableSettingKey(node.name);

    const nodeClasses = [
      'node-content',
      isActive ? 'active' : '',
      (isMapped || isAutoDetected) ? 'has-property' : '',
    ].filter(Boolean).join(' ');

    return (
      <li className={isActive ? 'active' : ''}>
        <div className={nodeClasses} onClick={() => hasChildren && setIsOpen(!isOpen)}>
          <span className={`node-toggle ${hasChildren ? 'has-child' : 'no-child'}`}>
            {hasChildren ? (isOpen ? <FiChevronDown /> : <FiChevronRight />) : <span className="no-toggle"></span>}
          </span>
          <span className={`node-icon ${label}`}>{icon}</span>
          {showNodeClass ? (
            <span className="node-class"> {className} </span>
          ) : (
            <span className="node-tag">&lt;{label} /&gt;</span>
          )}

          {/* Property indicator badge */}
          {(isMapped || isAutoDetected) && (
            <span className="node-property-badge">
              <FaPlug size={8} /> prop
            </span>
          )}

          {/* Manual mode: Expose as Property button */}
          {isExposable && !isMapped && (
            <button
              className="expose-property-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleExposeAsProperty(node);
              }}
              title="Expose as Component Property"
            >
              <FaPlug size={9} /> Expose
            </button>
          )}

          {/* Manual mode: Already exposed indicator with click-to-remove */}
          {isExposable && isMapped && (
            <button
              className="expose-property-btn exposed"
              onClick={(e) => {
                e.stopPropagation();
                handleExposeAsProperty(node);
              }}
              title="Remove property mapping"
            >
              <FaPlug size={9} /> Mapped
            </button>
          )}
        </div>
        {hasChildren && isOpen && (
          <ul>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="structure-view">
      <ul>
        {roots.map(node => (
          <TreeNode key={node.id} node={node} />
        ))}
      </ul>
    </div>
  );
};

export default StructureView;