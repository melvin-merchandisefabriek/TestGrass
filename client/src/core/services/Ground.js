import React from 'react';
import Shape from './Shape';

const Ground = () => {
  // The shape component will load and process the JSON file from the public folder
  const shapeFilePath = process.env.PUBLIC_URL + '/data/groundShape.json';

  return (
    <div className="ground-component">
      <Shape filePath={shapeFilePath} />
    </div>
  );
};

export default Ground;
