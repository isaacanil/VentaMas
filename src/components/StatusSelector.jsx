
import React, { useState, useRef } from 'react';

import { useClickOutSide } from '../../hooks/useClickOutSide';

const StatusSelector = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useClickOutSide(menuRef, isMenuOpen, () => setIsMenuOpen(false));

    const handleButtonClick = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div ref={menuRef}>
            <button onClick={handleButtonClick}>Toggle Menu</button>
            {isMenuOpen && (
                <div className="menu">
                    {/* ...menu items... */}
                </div>
            )}
        </div>
    );
};

export default StatusSelector;