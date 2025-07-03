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
      {/* {blades.map((pos, idx) => {
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
      })} */}
    </div>
  );
};

// Helper to generate a random greenish color
export function randomGrassColor() {
  const h = 100 + Math.random() * 40; // green hue
  const s = 60 + Math.random() * 20;
  const l = 35 + Math.random() * 20;
  return `hsl(${h},${s}%,${l}%)`;
}

// Export a function that returns an array of blade data for SVG rendering (with animation)
export function getGrassBladeData(count, width, height = 1080, baseHeight = 0) {
  // Restore to the previous working version: use direct, larger base values (no scale factor)
  const bladeBaseY = height - 180 - baseHeight; // 180 is the blade height
  return Array.from({ length: count }, (_, i) => {
    console.log('unc - count:', count);
    let baseX;
      baseX = (i / (count)) * (width*0.5-100); // leave margin, 100px on each side
    let x;
    x = baseX + ((Math.random()-0.5) * 10); // jitter
    const y = 0;
    const phase = (i / count) * 2 * Math.PI;
    const randomTopOffset = Math.random() * 50 - 2;
    const controlPointAnimations = {
      "tri-top": {
        formula: {
          x: { expression: `100+30*sin(PI*n*2-(PI/2)+${phase-1.2*Math.random()})` },
          y: { expression: `${bladeBaseY + 50}+${randomTopOffset}` }
        }
      },
      "tri-top-right-c1": {
        formula: {
          x: { expression: `105+15*sin(PI*n*2-1+${phase+0.3*Math.random()})` },
          y: { expression: `${bladeBaseY + 100}+${10}*sin(PI*n*4)+${randomTopOffset}` }
        }
      },
      "tri-top-right-c2": {
        formula: {
          x: { expression: `105+5*sin(PI*n*2-1+${phase+0.3*Math.random()})` },
          y: { expression: `${bladeBaseY + 140}+${1}*sin(PI*n*4)+${randomTopOffset}` }
        }
      },
      "tri-left-top-c1": {
        formula: {
          x: { expression: `95+5*sin(PI*n*2-1+${phase+0.3*Math.random()})` },
          y: { expression: `${bladeBaseY + 140}+${1}*sin(PI*n*4)+${randomTopOffset}` }
        }
      },
      "tri-left-top-c2": {
        formula: {
          x: { expression: `95+15*sin(PI*n*2-1+${phase+0.3*Math.random()})` },
          y: { expression: `${bladeBaseY + 100}+${10}*sin(PI*n*4)+${randomTopOffset}` }
        }
      },
      "tri-right": {
        formula: {
          x: { expression: `110` },
          y: { expression: `${bladeBaseY + 180}`}
        }
      },
      "tri-left": {
        formula: {
          x: { expression: `90` },
          y: { expression: `${bladeBaseY + 180}`}
        }
      }
    };
    return {
      position: { x, y },
      controlPointAnimations,
      fill: `rgba(0, 105, 0, ${0.5 + 0.5 * Math.random()})`
    };
  });
}

export default TriangleArray;
