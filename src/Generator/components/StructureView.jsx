import React, { useState, useMemo, useEffect } from 'react';
import {
  BsSquare, BsCardHeading, BsTextParagraph, BsLayoutSplit,
  BsLayoutThreeColumns, BsCodeSlash, BsBricks, BsLayoutTextSidebarReverse,
  BsListUl, BsInputCursorText, BsInputCursor, BsMenuButtonWide, BsTextareaT,
  BsTag, BsImage, BsTable, BsLink45Deg, BsTypeH1, BsTypeH2, BsTypeH3,
  BsTypeH4, BsTypeH5, BsTypeH6, BsTypeBold, BsTypeItalic, BsClock,
  BsClockHistory, BsWindow, BsBraces, BsLayoutSidebarReverse
} from 'react-icons/bs';
import { GrCursor }          from 'react-icons/gr';
import { RxSection }         from 'react-icons/rx';
import { CgDisplayFullwidth } from 'react-icons/cg';
import { MdOutlineWidthFull } from 'react-icons/md';
import { CiBoxList }         from 'react-icons/ci';
import { FaWpforms }         from 'react-icons/fa6';
import { TbSvg }             from 'react-icons/tb';
import { IoLogoJavascript }  from 'react-icons/io';
import { IoText }            from 'react-icons/io5';
import { DiMarkdown }        from 'react-icons/di';
import { IoIosLink }         from 'react-icons/io';
import { RxButton }          from 'react-icons/rx';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { FaPlug, FaCheck }  from 'react-icons/fa6';
import { useGenerator }      from '@contexts/GeneratorContext';
import './StructureView.scss';

const ICONS = {
  section: <CgDisplayFullwidth />,
  container: <MdOutlineWidthFull />,
  div: <RxSection />,
  block: <BsBricks />,
  header: <BsLayoutTextSidebarReverse />,
  footer: <BsLayoutTextSidebarReverse />,
  main: <BsLayoutSidebarReverse />,
  article: <BsLayoutTextSidebarReverse />,
  aside: <BsLayoutSidebarReverse />,
  template: <BsBricks />,
  slot: <BsBricks />,
  heading: <BsTypeH1 />,
  h1: <BsTypeH1 />, h2: <BsTypeH2 />, h3: <BsTypeH3 />,
  h4: <BsTypeH4 />, h5: <BsTypeH5 />, h6: <BsTypeH6 />,
  p: <BsTextParagraph />, span: <BsTextParagraph />,
  strong: <BsTypeBold />, b: <BsTypeBold />,
  i: <BsTypeItalic />, em: <BsTypeItalic />,
  small: <BsTextParagraph />, mark: <DiMarkdown />,
  label: <BsTextareaT />, text: <BsTextareaT />,
  'text-basic': <IoText />,
  ul: <CiBoxList />, ol: <CiBoxList />, li: <CiBoxList />, list: <CiBoxList />,
  nav: <BsLayoutTextSidebarReverse />, menu: <BsListUl />, breadcrumb: <BsListUl />,
  form: <FaWpforms />, input: <FaWpforms />, textarea: <FaWpforms />,
  select: <FaWpforms />, option: <FaWpforms />, fieldset: <FaWpforms />,
  legend: <FaWpforms />, checkbox: <FaWpforms />, radio: <FaWpforms />,
  'text-link': <IoIosLink />, a: <IoIosLink />,
  button: <GrCursor />, details: <RxButton />, summary: <RxButton />,
  img: <BsImage />, image: <BsImage />, picture: <BsImage />,
  figure: <BsImage />, figcaption: <BsImage />,
  video: <BsImage />, audio: <BsImage />, source: <BsImage />, iframe: <BsImage />,
  svg: <TbSvg />, canvas: <TbSvg />, path: <TbSvg />,
  table: <BsTable />, thead: <BsTable />, tbody: <BsTable />,
  tfoot: <BsTable />, tr: <BsTable />, th: <BsTable />, td: <BsTable />,
  caption: <BsTable />,
  time: <BsClock />, progress: <BsClockHistory />, meter: <BsClockHistory />,
  dialog: <BsWindow />, meta: <BsBricks />, link: <BsLink45Deg />,
  style: <BsBraces />, noscript: <BsBraces />, script: <IoLogoJavascript />,
  code: <BsCodeSlash />, pre: <BsCodeSlash />,
  default: <BsSquare />,
};

const getExposableSettingKey = (elementName) => {
  const map = {
    heading:     'text',
    'text-basic':'text',
    'text-link': 'text',
    image:       'image',
    button:      'text',
    icon:        'icon',
    a:           'link',
  };
  return map[elementName] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// StructureView
// ─────────────────────────────────────────────────────────────────────────────
const StructureView = ({ data, globalClasses, activeIndex, showNodeClass }) => {
  const {
    componentMode,
    componentAutoDetect,
    componentManualProperties,
    setComponentManualProperties,
    componentRootIds,
    setComponentRootIds,
    setComponentMode,
    activeComponentRootId,
    setActiveComponentRootId,
    setLayerElements,
  } = useGenerator();

  // Sync the flat element list into context whenever it changes
  useEffect(() => {
    if (data && data.length > 0) {
      setLayerElements(data);
    }
  }, [data, setLayerElements]);

  // Build a map: elementId -> which componentRootId it belongs to
  const elementToRootId = useMemo(() => {
    const map = new Map();
    if (!data || componentRootIds.length === 0) return map;

    const elementMap = new Map(data.map(el => [el.id, el]));

    data.forEach(el => {
      let curr = el;
      while (curr) {
        if (componentRootIds.includes(curr.id)) {
          map.set(el.id, curr.id);
          break;
        }
        curr = (curr.parent && curr.parent !== 0 && curr.parent !== '0')
          ? elementMap.get(curr.parent)
          : null;
      }
    });

    return map;
  }, [data, componentRootIds]);

  // Set of element IDs already exposed as manual properties
  const mappedElementIds = useMemo(() => {
    const ids = new Set();
    (componentManualProperties || []).forEach(mp => {
      if (mp.elementId) ids.add(mp.elementId);
    });
    return ids;
  }, [componentManualProperties]);

  if (!data || data.length === 0) return null;

  // Build tree from flat array
  const elementsById = {};
  data.forEach(el => { elementsById[el.id] = { ...el, children: [] }; });
  const roots = [];
  data.forEach(el => {
    if (el.parent && elementsById[el.parent]) {
      elementsById[el.parent].children.push(elementsById[el.id]);
    } else {
      roots.push(elementsById[el.id]);
    }
  });

  const handleExposeAsProperty = (element) => {
    const settingKey = getExposableSettingKey(element.name);
    if (!settingKey) return;

    if (mappedElementIds.has(element.id)) {
      setComponentManualProperties(prev =>
        prev.filter(mp => mp.elementId !== element.id)
      );
      return;
    }

    const rawLabel = (element.label || element.name || '')
      .replace(/__/g, ' ').replace(/--/g, ' ')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()).trim();

    const typeMap = { image: 'image', link: 'link', icon: 'icon' };
    const type = typeMap[settingKey] || 'text';
    const defaultValue = element.settings?.[settingKey] ?? '';

    setComponentManualProperties(prev => [
      ...prev,
      { label: rawLabel, type, default: defaultValue, elementId: element.id, settingKey },
    ]);
  };

  const handleNodeClick = (nodeId) => {
    // When clicking any element, set the active component root to whichever root owns it
    const owningRoot = elementToRootId.get(nodeId) || null;
    setActiveComponentRootId(owningRoot);
  };

  const handleToggleComponentRoot = (nodeId) => {
    const isRoot = componentRootIds.includes(nodeId);
    const newIds = isRoot
      ? componentRootIds.filter(id => id !== nodeId)
      : [...componentRootIds, nodeId];

    setComponentRootIds(newIds);
    setComponentMode(newIds.length > 0);

    // When making something a root, immediately select it as active
    if (!isRoot) {
      setActiveComponentRootId(nodeId);
    } else {
      // If de-selecting the currently active root, clear or pick another
      if (activeComponentRootId === nodeId) {
        setActiveComponentRootId(newIds.length > 0 ? newIds[0] : null);
      }
    }
  };

  return (
    <div className="structure-view">
      <ul>
        {roots.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            activeIndex={activeIndex}
            showNodeClass={showNodeClass}
            globalClasses={globalClasses}
            componentMode={componentMode}
            componentAutoDetect={componentAutoDetect}
            componentRootIds={componentRootIds}
            activeComponentRootId={activeComponentRootId}
            mappedElementIds={mappedElementIds}
            handleExposeAsProperty={handleExposeAsProperty}
            handleNodeClick={handleNodeClick}
            handleToggleComponentRoot={handleToggleComponentRoot}
          />
        ))}
      </ul>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TreeNode
// ─────────────────────────────────────────────────────────────────────────────
const TreeNode = ({
  node,
  activeIndex,
  showNodeClass,
  globalClasses,
  componentMode,
  componentAutoDetect,
  componentRootIds,
  activeComponentRootId,
  mappedElementIds,
  handleExposeAsProperty,
  handleNodeClick,
  handleToggleComponentRoot,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const icon = ICONS[node.name] || ICONS.default;
  const label = node.name || 'div';
  let className = '';
  if (node.settings?._cssGlobalClasses?.length > 0) {
    const gc = (globalClasses || []).find(g => g.id === node.settings._cssGlobalClasses[0]);
    if (gc) className = `.${gc.name}`;
  }

  const isActive           = node._order === activeIndex;
  const isComponentRoot    = componentRootIds.includes(node.id);
  const isActiveRoot       = activeComponentRootId === node.id;
  const isMapped           = mappedElementIds.has(node.id);
  const canExpose          = !!getExposableSettingKey(node.name);
  const isAutoDetected     = componentMode && componentAutoDetect && canExpose;
  const showManualBtn      = componentMode && !componentAutoDetect && canExpose;

  const nodeClasses = [
    'node-content',
    isActive           ? 'active'            : '',
    (isMapped || isAutoDetected) ? 'has-property' : '',
    isComponentRoot    ? 'is-component-root' : '',
    isActiveRoot       ? 'is-active-root'    : '',
  ].filter(Boolean).join(' ');

  const handleRowClick = (e) => {
    e.stopPropagation();
    handleNodeClick(node.id);
    if (hasChildren) setIsOpen(o => !o);
  };

  return (
    <li>
      <div className={nodeClasses} onClick={handleRowClick}>

        {/* Expand/collapse chevron */}
        <span className={`node-toggle ${hasChildren ? 'has-child' : 'no-child'}`}>
          {hasChildren
            ? (isOpen ? <FiChevronDown /> : <FiChevronRight />)
            : <span className="no-toggle" />}
        </span>

        {/* Element icon */}
        <span className={`node-icon ${label}`}>{icon}</span>

        {/* Label */}
        {showNodeClass
          ? <span className="node-class"> {className} </span>
          : <span className="node-tag">&lt;{label} /&gt;</span>}

        {/* Auto-detect badge */}
        {(isMapped || isAutoDetected) && (
          <span className="node-property-badge">
            <FaPlug size={8} /> prop
          </span>
        )}

        {/* Manual mode: expose / un-expose */}
        {showManualBtn && !isMapped && (
          <button
            className="expose-property-btn"
            onClick={(e) => { e.stopPropagation(); handleExposeAsProperty(node); }}
            title="Expose as Component Property"
          >
            <FaPlug size={9} /> Expose
          </button>
        )}
        {showManualBtn && isMapped && (
          <button
            className="expose-property-btn exposed"
            onClick={(e) => { e.stopPropagation(); handleExposeAsProperty(node); }}
            title="Click to un-expose"
          >
            <FaCheck size={9} /> Mapped
          </button>
        )}

        {/* Make / Remove Component Root */}
        <button
          className={`expose-property-btn component-root-btn ${isComponentRoot ? 'active-root' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleToggleComponentRoot(node.id); }}
          title={isComponentRoot ? 'Remove from components' : 'Make Component Root'}
        >
          <BsBricks size={11} />
        </button>
      </div>

      {hasChildren && isOpen && (
        <ul>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              activeIndex={activeIndex}
              showNodeClass={showNodeClass}
              globalClasses={globalClasses}
              componentMode={componentMode}
              componentAutoDetect={componentAutoDetect}
              componentRootIds={componentRootIds}
              activeComponentRootId={activeComponentRootId}
              mappedElementIds={mappedElementIds}
              handleExposeAsProperty={handleExposeAsProperty}
              handleNodeClick={handleNodeClick}
              handleToggleComponentRoot={handleToggleComponentRoot}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default StructureView;