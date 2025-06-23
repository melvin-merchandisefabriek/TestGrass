import React, { useState, useCallback, useRef, useEffect } from 'react';
import Shape from './Shape';

/**
 * MenuButton component with a square shape loaded from JSON
 * @returns {JSX.Element} The MenuButton component
 */
const MenuButton = () => {
  //const test = rgba(255, 255, 255, 0.51)
  // Path to JSON files
  const menuButtonSquarePath = process.env.PUBLIC_URL + '/data/menuButtonSquare.json';
  const expandPath = process.env.PUBLIC_URL + '/data/menuButtonExpand.json';
  const normalPath = process.env.PUBLIC_URL + '/data/menuButtonNormal.json';
  
  // State to track whether the button is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State for storing loaded modifications
  const [expandModifications, setExpandModifications] = useState(null);
  const [normalModifications, setNormalModifications] = useState(null);
  
  // Reference to the menu button container for click outside detection
  const menuRef = useRef(null);
  
  // Load expansion and normal modifications from JSON files
  useEffect(() => {
    const loadModifications = async () => {
      try {
        // Load expand modifications
        const expandResponse = await fetch(expandPath);
        if (!expandResponse.ok) {
          throw new Error(`Failed to load expand modifications: ${expandResponse.status}`);
        }
        const expandData = await expandResponse.json();
        setExpandModifications(expandData);
        
        // Load normal modifications
        const normalResponse = await fetch(normalPath);
        if (!normalResponse.ok) {
          throw new Error(`Failed to load normal modifications: ${normalResponse.status}`);
        }
        const normalData = await normalResponse.json();
        setNormalModifications(normalData);
      } catch (error) {
        console.error('Error loading modifications:', error);
      }
    };
    
    loadModifications();
  }, [expandPath, normalPath]);
  
  // Handle click outside the menu to collapse it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isExpanded && menuRef.current && !menuRef.current.contains(event.target)) {
        console.log('Clicked outside menu - collapsing');
        setIsExpanded(false);
      }
    };
    
    // Add event listener when expanded
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);
  
  // Handle click on the menu button
  const handleClick = useCallback(() => {
    if (!expandModifications) {
      console.warn('Expand modifications not yet loaded');
      return;
    }
    
    console.log('Menu button clicked - expanding');
    
    // Set expanded state
    setIsExpanded(true);
  }, [expandModifications]);

  // Determine which modifications to apply based on expanded state
  const currentModifications = isExpanded ? expandModifications : normalModifications;

  return (
    <div ref={menuRef} className="menu-button-container">
      <Shape 
        className="menu-button-shape"
        filePath={menuButtonSquarePath}
        shapeModifications={currentModifications}
        onClick={handleClick}
      />
      {isExpanded && (
        <div className="menu-content">
        </div>
      )}
    </div>
  );
};

export default MenuButton;
