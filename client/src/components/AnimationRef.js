import React from 'react';
import Shape from './Shape';

const AnimationRef = () => {
    // Define paths to shape and wind effect
  const sinShape = process.env.PUBLIC_URL + '/data/sinShape.json';

  return (
    <div className="AnimationRef-container">
      <Shape filePath={sinShape} />
    </div>
  );
};

export default AnimationRef;
