import React from 'react';
import ShapeWebGLDemo from './ShapeWebGLDemo';

// Renders a field of animated grass blades using ShapeWebGLDemo
const GrassFieldWebGL = ({ bladeCount = 20, width = '100vw', height = '100vh' }) => {
  // Distribute blades horizontally, optionally with some randomization
  const blades = Array.from({ length: bladeCount }, (_, i) => {
    const frac = bladeCount === 1 ? 0.5 : i / (bladeCount - 1);
    // Spread from -0.8 to +0.8 in NDC (leaving some margin)
    const baseX = -0.8 + frac * 1.6 + (Math.random() - 0.5) * 0.05;
    const baseY = 0; // Centered vertically
    // Make grass much smaller:
    const scale = 0.08 + Math.random() * 0.17;
    const phase = 0*Math.random() * Math.PI * 2;
    const speed = 0.7 + Math.random() * 0.6;
    const swayAmount = 0.7 + Math.random() * 0.6;
    return { baseX, baseY, scale, phase, speed, swayAmount };
  });

  // Render a single canvas, but pass all blades to the demo
  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      <ShapeWebGLDemo bladeCount={bladeCount} blades={blades} height={height} />
    </div>
  );
};

export default GrassFieldWebGL;
