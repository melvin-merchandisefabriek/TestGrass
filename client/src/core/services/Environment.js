import React from 'react';
import Grass from './Grass';
import Ground from './Ground';

const Environment = () => {
  return (
    <div className="environment-container">
      <Grass />
      <Ground />
    </div>
  );
};

export default Environment;
