import React from 'react';
import Shape from './Shape';

/**
 * Menu component with a square shape loaded from JSON
 * @returns {JSX.Element} The Menu component
 */
const Menu = () => {
  // Path to the menu square shape JSON file
  const menuSquarePath = process.env.PUBLIC_URL + '/data/menuSquare.json';

  return (
    <div className="menu-container">
      <Shape filePath={menuSquarePath} />
    </div>
  );
};

export default Menu;
