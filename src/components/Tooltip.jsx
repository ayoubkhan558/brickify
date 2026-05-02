import React, { useId } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import './Tooltip.scss';

/**
 * A reusable Tooltip component that wraps react-tooltip with custom styling and behavior.
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the tooltip
 * @param {React.ReactNode} props.children - The content that triggers the tooltip
 * @param {string|React.ReactNode} props.content - The content to display in the tooltip
 * @param {'top'|'right'|'bottom'|'left'} [props.position='top'] - Position of the tooltip
 * @param {string} [props.className=''] - Additional CSS class for the trigger element
 * @param {string} [props.tooltipClassName=''] - Additional CSS class for the tooltip
 * @param {number} [props.delayShow=300] - Delay before showing the tooltip (ms)
 * @param {number} [props.delayHide=0] - Delay before hiding the tooltip (ms)
 * @param {boolean} [props.clickable=false] - Whether the tooltip should stay open when clicked
 * @param {Object} [props.style] - Inline styles for the trigger element
 * @param {Function} [props.onClick] - Click handler for the trigger element
 * @returns {React.ReactElement} The Tooltip component
 */
const Tooltip = ({
  id,
  children,
  content,
  position = 'top',
  className = '',
  tooltipClassName = '',
  delayShow = 300,
  delayHide = 0,
  clickable = false,
  style,
  onClick,
  ...rest
}) => {
  // Generate a unique ID if none is provided
  const generatedId = useId();
  const tooltipId = id || `tooltip-${generatedId}`;
  
  // Handle click events
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <span 
        data-tooltip-id={tooltipId}
        data-tooltip-content={typeof content === 'string' ? content : undefined}
        data-tooltip-place={position}
        data-tooltip-delay-show={delayShow}
        data-tooltip-delay-hide={delayHide}
        data-tooltip-clickable={clickable}
        className={`tooltip-trigger ${className}`}
        style={style}
        onClick={handleClick}
        aria-describedby={tooltipId}
        role="tooltip"
        tabIndex={0}
        {...rest}
      >
        {children}
      </span>
      
      {/* Only render the tooltip content if it's a React node */}
      {typeof content !== 'string' && (
        <ReactTooltip 
          id={tooltipId}
          className={`custom-tooltip ${tooltipClassName}`}
          effect="solid"
          delayShow={delayShow}
          delayHide={delayHide}
          clickable={clickable}
        >
          {content}
        </ReactTooltip>
      )}
    </>
  );
};

export default Tooltip;
