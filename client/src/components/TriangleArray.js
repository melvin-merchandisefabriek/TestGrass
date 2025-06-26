import React from 'react';
import Shape from './Shape';
import GrassBlade from './GrassBlade';
/*"tri-top", "x": 100, "y": 20, "type": "anchor" },
    { "id": "tri-right", "x": 105, "y": 180, "type": "anchor" },
    { "id": "tri-left", "x": 95, "y": 180, "type": "anchor" },
    
    { "id": "tri-top-right-c1", "x": 100, "y": 50, "type": "control" },
    { "id": "tri-top-right-c2", "x": 100, "y": 120, "type": "control" },
    
    { "id": "tri-left-top-c1", "x": 100, "y": 120, "type": "control" },
    { "id": "tri-left-top-c2",*/
const TriangleArray = () => {
  const simpleWave = {
    controlPointAnimations: {
      "tri-top": {
        formula: {
          x: { expression: "100+50*sin(PI*n*2-(PI/2))" },
          y: { expression: "50-20*sin(PI*n*4-PI/2)" }
        }
      }
    }
  };
  return (
    <div className="grass-component">
      <GrassBlade position={{ x: 100, y: 50 }} controlPointAnimations={simpleWave.controlPointAnimations} />
    </div>
  );
};

export default TriangleArray;
