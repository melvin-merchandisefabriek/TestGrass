import React from 'react';
import Shape from './Shape';

/**
 * Player component for controlling and displaying player information
 * 
 * @returns {JSX.Element} The rendered Player component
 */
const Player = () => {
  // The shape component will load and process the JSON file
  const playerShapePath = process.env.PUBLIC_URL + '/data/simplePlayer.json';

  return (
    <div className="player-container">
      <Shape filePath={playerShapePath} />
    </div>
  );
};

export default Player;
