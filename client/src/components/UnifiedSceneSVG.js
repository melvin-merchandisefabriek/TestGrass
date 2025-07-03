import React, { useState, useEffect } from 'react';
import Shape from './Shape';
import { getGrassBladeData } from './TriangleArray';

const trianglePath = process.env.PUBLIC_URL + '/data/triangleShape.json';

const UnifiedSceneSVG = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = windowSize;
  const viewBox = `0 0 ${width} ${height}`;

  // Get animated grass blade data from TriangleArray.js, pass width for spacing
  const blades = getGrassBladeData(150, width, height);
  console.log('unc - width:', width);

  return (
    <svg
      width="100vw"
      height="100vh"
      viewBox={viewBox}
      style={{ display: 'block', background: '#222' }}
    >
      {/* Grass blades as Shape components rendered as SVG groups */}
      {blades.map((blade, idx) => (
        <Shape
          key={idx}
          filePath={trianglePath}
          shapeModifications={{
            modifyPosition: { svg: blade.position, global: undefined}, // scale up each blade
            animations: { controlPointAnimations: blade.controlPointAnimations, styleAnimations: { fill: blade.fill } }
          }}
          renderAsGroup={true}
        />
      ))}
      {/* Debug squares at the four corners of the SVG */}
      <rect x={0} y={0} width={40} height={40} fill="red" />
      <rect x={width-40} y={0} width={40} height={40} fill="green" />
      <rect x={0} y={height-40} width={40} height={40} fill="blue" />
      <rect x={width-40} y={height-40} width={40} height={40} fill="yellow" />
      {/* All other shapes/paths will go here in later steps */}
    </svg>
  );
};

export default UnifiedSceneSVG;
