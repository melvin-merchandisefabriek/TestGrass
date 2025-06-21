import React from 'react';
import Shape from './Shape';

/**
 * MenuButton component with a square shape loaded from JSON
 * @returns {JSX.Element} The MenuButton component
 */
const MenuButton = () => {
  // Path to the menu button square shape JSON file
  const menuButtonSquarePath = process.env.PUBLIC_URL + '/data/menuButtonSquare.json';
  const placeholderPath = process.env.PUBLIC_URL + '/data/placeholder.json';

  return (
    <div className="menu-button-container">
      <Shape filePath={menuButtonSquarePath} modificationsPath={placeholderPath}/>
    </div>
  );
};

export default MenuButton;
