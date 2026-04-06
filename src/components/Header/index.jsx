import React, { useState, useEffect } from 'react';
import { FaCopy, FaChevronDown, FaDownload } from 'react-icons/fa';
import { VscCopy } from 'react-icons/vsc';
import { FaPlug } from 'react-icons/fa6';
import { useGenerator } from '@contexts/GeneratorContext';
import './Header.scss';

const Header = ({
    inlineStyleHandling,
    setInlineStyleHandling,
    mergeNonClassSelectors,
    setMergeNonClassSelectors,
    showNodeClass,
    setShowNodeClass,
    output,
    html,
    clipboard
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { componentMode } = useGenerator();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.split-dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <header className="app-header">
            <div className="app-header__logo">
                <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 732.42">
                    <rect width="750" height="732.422" rx="35" fill="#FFD53E"></rect>
                    <path d="M300.691 278C326.025 278 348.025 283.833 366.691 295.5C385.691 306.833 400.358 323 410.691 344C421.358 364.667 426.691 389.167 426.691 417.5C426.691 444.5 421.525 468.333 411.191 489C401.191 509.667 386.858 525.667 368.191 537C349.858 548.333 328.025 554 302.691 554C280.025 554 260.358 548.5 243.691 537.5C227.358 526.167 214.691 510.333 205.691 490C197.025 469.333 192.691 445 192.691 417C192.691 388.333 197.025 363.667 205.691 343C214.358 322 226.691 306 242.691 295C259.025 283.667 278.358 278 300.691 278ZM278.691 346.5C267.691 346.5 257.691 349.5 248.691 355.5C240.025 361.167 233.191 369.167 228.191 379.5C223.525 389.5 221.191 401.333 221.191 415C221.191 428.333 223.525 440.333 228.191 451C233.191 461.333 240.025 469.333 248.691 475C257.691 480.667 267.691 483.5 278.691 483.5C290.358 483.5 300.525 480.667 309.191 475C318.191 469 325.025 460.833 329.691 450.5C334.691 440.167 337.191 428.333 337.191 415C337.191 401.667 334.691 389.833 329.691 379.5C325.025 369.167 318.191 361.167 309.191 355.5C300.525 349.5 290.358 346.5 278.691 346.5ZM132.191 180H221.191V551H132.191V180ZM648.465 357.5C630.798 355.5 615.298 357 601.965 362C588.965 367 578.798 374.667 571.465 385C564.465 395 560.965 407.167 560.965 421.5L539.965 417.5C539.965 388.167 544.298 363 552.965 342C561.965 321 574.632 305 590.965 294C607.298 282.667 626.465 277 648.465 277V357.5ZM472.465 281H561.465V551H472.465V281Z" fill="#1E1E1E"></path>
                </svg>

                <span>Brickify </span>
            </div>

            <div className="app-header__controls">
                <div className="generator-options">
                    <div className="form-control">
                        <span className="form-control__label">Inline Styles</span>
                        <div className="form-control__options">
                            <label className="form-control__option">
                                <input type="radio" name="inlineStyleHandling" value="skip" checked={inlineStyleHandling === 'skip'} onChange={() => setInlineStyleHandling('skip')} className="form-control__radio" />
                                <span className="form-control__text">Skip</span>
                            </label>
                            <label className="form-control__option">
                                <input type="radio" name="inlineStyleHandling" value="inline" checked={inlineStyleHandling === 'inline'} onChange={() => setInlineStyleHandling('inline')} className="form-control__radio" />
                                <span className="form-control__text">Inline</span>
                            </label>
                            <label className="form-control__option">
                                <input type="radio" name="inlineStyleHandling" value="class" checked={inlineStyleHandling === 'class'} onChange={() => setInlineStyleHandling('class')} className="form-control__radio" />
                                <span className="form-control__text">Class</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="form-control__label">Merge Selectors</label>
                        <div className="form-control__options----">
                            <span className="form-control__option">
                                <label className="form-control__switch">
                                    <input
                                        type="checkbox"
                                        checked={mergeNonClassSelectors}
                                        onChange={(e) => setMergeNonClassSelectors(e.target.checked)}
                                    />
                                    <span className="form-control__slider"></span>
                                </label>
                            </span>
                        </div>
                    </div>

                    <div className="form-control__option">
                        <label className="form-control__label">
                            Generate Class Labels
                        </label>
                        <label className="form-control__switch" style={{ marginRight: 8 }}>
                            <input
                                type="checkbox"
                                checked={showNodeClass}
                                onChange={() => setShowNodeClass((prev) => !prev)}
                            />
                            <span className="form-control__slider"></span>
                        </label>
                    </div>

                    {/* Removed Component Mode Toggle */}
                </div>

                <div className="app-header__actions">
                    <div className="split-dropdown">
                        <button
                            className="button primary split-dropdown__main"
                            onClick={() => clipboard.copyToClipboard(output)}
                            disabled={typeof html !== 'string' || !html.trim()}
                        >
                            <VscCopy />
                            {clipboard.isCopied
                                ? 'Copied to Clipboard!'
                                : componentMode
                                    ? 'Copy Bricks Structure'
                                    // ? 'Copy Component'
                                    : 'Copy Bricks Structure'
                            }
                        </button>
                        <button
                            className="button primary split-dropdown__toggle"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={typeof html !== 'string' || !html.trim()}
                            aria-expanded={isDropdownOpen}
                        >
                            <FaChevronDown size={12} />
                        </button>
                        {isDropdownOpen && (
                            <div className="split-dropdown__menu">
                                <button
                                    className="split-dropdown__item"
                                    onClick={() => {
                                        clipboard.handleExportJson(output);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <FaDownload size={14} />
                                    <span>Export as JSON</span>
                                </button>
                                <button
                                    className="split-dropdown__item"
                                    onClick={() => {
                                        clipboard.copyToClipboard(output);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <FaCopy size={14} />
                                    <span>Copy to Clipboard</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

