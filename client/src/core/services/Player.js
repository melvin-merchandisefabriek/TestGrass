import React from 'react';
import Shape from './Shape';

/**
 * Player component for controlling and displaying player information
 * 
 * @returns {JSX.Element} The rendered Player component
 */
const Player = () => {
  // Define paths to shape and wind effect
  const playerShapePath = process.env.PUBLIC_URL + '/data/simplePlayer.json';
  const windEffectPath = process.env.PUBLIC_URL + '/data/wind.json';

  return (
    <div className="player-container">
      <Shape filePath={playerShapePath} modificationsPath={windEffectPath} />
    </div>
  );
};

export default Player;
