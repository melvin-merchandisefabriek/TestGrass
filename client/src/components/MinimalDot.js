import React from 'react';
import MultiBezierWebGL from './MultiBezierWebGL';

function randomControlPoints() {
  // Each point in [-1, 1] x [-1, 1] (NDC)
  return Array.from({ length: 4 }, () => [
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ]);
}

const MinimalDot = () => {
  // Generate N random curves
  const N = 300;
  const curves = Array.from({ length: N }, (_, i) => randomControlPoints());
  return <MultiBezierWebGL curves={curves} height="100vh" />;
};

export default MinimalDot;
