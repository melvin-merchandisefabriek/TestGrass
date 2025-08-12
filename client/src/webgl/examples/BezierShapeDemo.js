import React from 'react';
import BezierShapeWebGL from '../components/BezierShapeWebGL';

// Example: an 8-sided closed shape using quadratic Beziers
const shape = [
  { type: 'quadratic', points: [[-0.5, 0.0], [-0.7, 0.5], [0.0, 0.7]] },
  { type: 'quadratic', points: [[0.0, 0.7], [0.7, 0.5], [0.5, 0.0]] },
  { type: 'quadratic', points: [[0.5, 0.0], [0.7, -0.5], [0.0, -0.7]] },
  { type: 'quadratic', points: [[0.0, -0.7], [-0.7, -0.5], [-0.5, 0.0]] },
  // You can add more segments for more complex shapes
];

const BezierShapeDemo = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222' }}>
      <BezierShapeWebGL shape={shape} resolution={40} />
    </div>
  );
};

export default BezierShapeDemo;
