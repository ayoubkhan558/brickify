import React from 'react';
import { FaTimes, FaCode, FaCss3, FaHtml5 } from 'react-icons/fa';
import './TutorialModal.scss';

const TutorialModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal--lg tutorial-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal__close" onClick={onClose}>
                    <FaTimes size={20} />
                </button>

                <div className="modal__content">
                    <h2>How to Use Brickify</h2>

                    <div className="tutorial-step">
                        <div className="tutorial-step__number">1</div>
                        <div className="tutorial-step__content">
                            <h3><FaHtml5 /> Paste Your HTML</h3>
                            <p>Copy your HTML code and paste it into the HTML tab on the left panel.</p>
                        </div>
                    </div>

                    <div className="tutorial-step">
                        <div className="tutorial-step__number">2</div>
                        <div className="tutorial-step__content">
                            <h3><FaCss3 /> Add Your CSS</h3>
                            <p>Switch to the CSS tab and paste your stylesheet. Brickify will automatically map CSS classes to Bricks global classes.</p>
                        </div>
                    </div>

                    <div className="tutorial-step">
                        <div className="tutorial-step__number">3</div>
                        <div className="tutorial-step__content">
                            <h3><FaCode /> Preview & Adjust</h3>
                            <p>Check the preview in the center panel. Use the settings in the header to control how inline styles and selectors are handled.</p>
                        </div>
                    </div>

                    <div className="tutorial-step">
                        <div className="tutorial-step__number">4</div>
                        <div className="tutorial-step__content">
                            <h3>📋 Copy Bricks Structure</h3>
                            <p>Click "Copy Bricks Structure" to copy the JSON. Then paste it into Bricks Builder using Ctrl+V or the paste function.</p>
                        </div>
                    </div>

                    <div className="tutorial-tips">
                        <h3>💡 Pro Tips</h3>
                        <ul>
                            <li>
                                <strong>Selector Strategy:</strong> Prefer simple, low-specificity class selectors and consistent CSS naming conventions such as <em>BEM</em> or <em>OOCSS</em> (e.g. <code>.block__element</code>) for predictable, scalable, and maintainable CSS
                            </li>
                            <li>
                                <strong>Inline Styles:</strong> Choose "Class" to convert inline styles to global classes for better reusability
                            </li>
                            <li>
                                <strong>Merge Selectors:</strong> Enable to combine element and class selectors only when necessary (e.g., <code>div.container</code>)
                            </li>
                            <li>
                                <strong>Class Labels:</strong> Enable to use CSS class names as element labels in Bricks
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
