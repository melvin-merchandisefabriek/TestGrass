import React from 'react';
import Shape from './Shape';
import GrassBlade from './GrassBlade';

const TriangleArray = () => {
  // Generate 100 positions in a grid, each with a random top offset
  const blades = Array.from({ length: 100 }, (_, i) => ({
    x: 140 + (i % 100) * 17.5 + Math.random() * 10,   // 10 columns, 12px apart, random jitter
    y: 110 + Math.floor(i / 10) * 0, // 10 rows, 0px apart (all on same y, but you can adjust)
    phase: (i / 100) * 2 * Math.PI, // unique phase for each blade
    randomTopOffset: Math.random() * 50 - 10 // random offset between -10 and +10
  }));

  return (
    <div className="grass-component">
      {blades.map((pos, idx) => {
        // Create a unique controlPointAnimations for each blade with a phase offset and top y offset
        const controlPointAnimations = {
          "tri-top": {
            formula: {
              x: { expression: `100+30*sin(PI*n*2-(PI/2)+${pos.phase-1.2*Math.random()})` },
              y: { expression: `50+${pos.randomTopOffset}` }
            }
          },
          "tri-top-right-c1": {
            formula: {
              x: { expression: `105+15*sin(PI*n*2-1+${pos.phase+0.3*Math.random()})` },
              y: { expression: `100+10*sin(PI*n*4)+${pos.randomTopOffset}` }
            }
          },
          "tri-top-right-c2": {
            formula: {
              x: { expression: `105+5*sin(PI*n*2-1+${pos.phase+0.3*Math.random()})` },
              y: { expression: `140+1*sin(PI*n*4)+${pos.randomTopOffset}` }
            }
          },
          "tri-left-top-c1": {
            formula: {
              x: { expression: `95+5*sin(PI*n*2-1+${pos.phase+0.3*Math.random()})` },
              y: { expression: `140+1*sin(PI*n*4)+${pos.randomTopOffset}` }
            }
          },
          "tri-left-top-c2": {
            formula: {
              x: { expression: `95+15*sin(PI*n*2-1+${pos.phase+0.3*Math.random()})` },
              y: { expression: `100+10*sin(PI*n*4)+${pos.randomTopOffset}` }
            }
          },
          "tri-right": {
            formula: {
              x: { expression: `110` },
              y: { expression: `180`}
            }
          },
          "tri-left": {
            formula: {
              x: { expression: `90` },
              y: { expression: `180`}
            }
          }
        };
        return (
          // const bleh = rgba(0, 105, 0, 0.84)
          <GrassBlade
            key={idx}
            position={{ x: pos.x, y: pos.y }}
            controlPointAnimations={controlPointAnimations}
            fill={`rgba(0, 105, 0, ${0.5 + 0.5 * Math.random()})`} // random opacity
          />
        );
      })}
    </div>
  );
};

export default TriangleArray;
