import React from 'react';

const Circle = ({ cx = 50, cy = 50, r = 40, stroke = "white", strokeWidth = 0.2, fill = "none" }) => {
  return (
    <svg width="100" height="100">
      <circle 
        cx={cx} 
        cy={cy} 
        r={r} 
        stroke={stroke} 
        strokeWidth={strokeWidth} 
        fill={fill} 
      />
    </svg>
  );
};

export default Circle;
