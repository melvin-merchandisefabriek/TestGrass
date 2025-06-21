import React from 'react';
import Shape from './Shape';

const Triangle = () => {
  const trianglePath = process.env.PUBLIC_URL + '/data/triangleShape.json';
  
  return (
    <Shape 
      className="triangle-shape"
      filePath={trianglePath}
    />
  );
};

const Grass = () => {
  return (
    <div className="grass-component">
      <Triangle />
      {/* Other grass elements will go here */}
    </div>
  );
};

export default Grass;
