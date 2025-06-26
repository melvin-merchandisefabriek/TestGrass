import React from 'react';
import Shape from './Shape';

const GrassBlade = ({
  position = { x: 0, y: 0 },
  controlPointAnimations = {},
}) => {
  const trianglePath = process.env.PUBLIC_URL + '/data/triangleShape.json';

  // Use modification logic to adjust position
  const shapeModifications = {
    modifyPosition: position,
    animations: {
      controlPointAnimations: controlPointAnimations
    }
  };

  return (
    <div className="grass-component">
      <Shape
        className="triangle-shape"
        filePath={trianglePath}
        shapeModifications={shapeModifications}
      />
    </div>
  );
};

export default GrassBlade;
