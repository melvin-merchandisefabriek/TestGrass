import React, { useState, useEffect, useCallback } from "react";

// Simple linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Simple random number generator
function pseudoRandom(seed) {
  return (Math.sin(seed * 9999.1) * 43758.5453) % 1;
}

const GRASS_MIN_HEIGHT = 20;
const GRASS_MAX_HEIGHT = 30;
const GRASS_BLADE_WIDTH = 2;
const GROUND_HEIGHT = 40;

// --- Basic Slider ---
function CustomSlider({ label, value, setValue, min, max, step = 1 }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label>
        {label}: <b>{value.toFixed(step < 1 ? 2 : 0)}</b>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

// --- Simplified Grass Blade ---
class GrassBlade {
  constructor({ baseX, baseY, bladeLen, windAngle, windStrength, color, bladeWidth }) {
    this.baseX = baseX;
    this.baseY = baseY;
    this.bladeLen = Math.max(0, bladeLen || 0);
    this.windAngle = windAngle || 0;
    this.windStrength = windStrength || 0;
    this.color = color || '#228B22';
    this.bladeWidth = Math.max(0.1, bladeWidth || 1);
  }

  // Returns tip position (x, y) 
  getTip() {
    const uprightAngle = -Math.PI / 2;
    const t = this.windStrength;
    const tipAngle = uprightAngle + (this.windAngle - uprightAngle) * t;
    const tipX = this.baseX + Math.cos(tipAngle) * this.bladeLen;
    const tipY = this.baseY + Math.sin(tipAngle) * this.bladeLen;
    return { tipX, tipY, tipAngle };
  }

  // Returns SVG path for the blade
  getBladePath() {
    const { tipX, tipY } = this.getTip();
    const halfWidth = this.bladeWidth / 2;
    const baseLeftX = this.baseX - halfWidth;
    const baseLeftY = this.baseY;
    const baseRightX = this.baseX + halfWidth;
    const baseRightY = this.baseY;
    
    // Use a simpler triangle shape for better performance
    return `M ${baseLeftX} ${baseLeftY} L ${tipX} ${tipY} L ${baseRightX} ${baseRightY} Z`;
  }
}

// Main component
export default function GrassField({ width = 600, height = 400, bladeCount = 40 }) {
  // Basic grass parameters
  const [minHeight, setMinHeight] = useState(GRASS_MIN_HEIGHT);
  const [maxHeight, setMaxHeight] = useState(GRASS_MAX_HEIGHT);
  const [bladeWidth, setBladeWidth] = useState(GRASS_BLADE_WIDTH);
  const [groundHeight, setGroundHeight] = useState(GROUND_HEIGHT);
  
  // Wind parameters
  const [windStrength, setWindStrength] = useState(0.4);
  const [windLeft, setWindLeft] = useState(false); // false = right, true = left
  
  // Animation state
  const [time, setTime] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [animating, setAnimating] = useState(true);

  // Wind animation
  useEffect(() => {
    if (!animating) return;
    
    let frameId;
    const updateFrame = (timestamp) => {
      if (!lastFrameTime) {
        setLastFrameTime(timestamp);
      }
      const elapsed = timestamp - lastFrameTime;
      if (elapsed > 30) { // limit to ~30fps for better performance
        setTime(prev => prev + elapsed * 0.001);
        setLastFrameTime(timestamp);
      }
      frameId = requestAnimationFrame(updateFrame);
    };
    
    frameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(frameId);
  }, [animating, lastFrameTime]);

  // Generate grass blades
  const generateBlades = useCallback(() => {
    if (typeof bladeCount !== 'number' || bladeCount <= 0) return [];

    const blades = [];
    const baseYField = height - groundHeight;
    
    for (let i = 0; i < bladeCount; i++) {
      const baseX = (width - 40) * (i / (bladeCount - 1)) + 20;
      const baseY = baseYField;
      
      const bladeLen = lerp(minHeight, maxHeight, pseudoRandom(i));
      const windAngle = windLeft ? -Math.PI / 4 : Math.PI / 4;
      // A simplified wind calculation
      const windEffect = Math.sin(time * 2 + i * 0.2) * 0.5 + 0.5;
      const thisWindStrength = windStrength * windEffect;
      
      const blade = new GrassBlade({
        baseX,
        baseY,
        bladeLen,
        windAngle,
        windStrength: thisWindStrength,
        color: `rgb(0, ${120 + Math.floor(pseudoRandom(i) * 80)}, 0)`,
        bladeWidth
      });
      
      const bladePath = blade.getBladePath();
      blades.push(
        <path
          key={`blade-${i}`}
          d={bladePath}
          fill={blade.color}
          stroke="#006600"
          strokeWidth={0.5}
        />
      );
    }
    
    return blades;
  }, [bladeCount, width, height, minHeight, maxHeight, bladeWidth, groundHeight, windStrength, windLeft, time]);

  // Generate components
  const blades = generateBlades();
  
  // Draw ground
  const drawGround = () => {
    return (
      <rect 
        x={0} 
        y={height - groundHeight} 
        width={width} 
        height={groundHeight} 
        fill="#4b8b3b" 
      />
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Main SVG Canvas */}
      <svg
        width={width}
        height={height}
        style={{
          background: 'linear-gradient(to bottom, #87CEEB, #E0F7FA)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {drawGround()}
        {blades}
      </svg>
      
      {/* Controls */}
      <div style={{ marginTop: 20, width: width, maxWidth: '100%' }}>
        <h3>Grass Controls</h3>
        
        <CustomSlider label="Min Blade Height" value={minHeight} setValue={setMinHeight} min={5} max={60} />
        <CustomSlider label="Max Blade Height" value={maxHeight} setValue={setMaxHeight} min={10} max={100} />
        <CustomSlider label="Blade Width" value={bladeWidth} setValue={setBladeWidth} min={0.5} max={10} step={0.1} />
        <CustomSlider label="Ground Height" value={groundHeight} setValue={setGroundHeight} min={10} max={100} />
        <CustomSlider label="Wind Strength" value={windStrength} setValue={setWindStrength} min={0} max={1} step={0.01} />
        
        <div style={{ marginTop: 10 }}>
          <label>
            <input 
              type="checkbox" 
              checked={windLeft} 
              onChange={() => setWindLeft(prev => !prev)} 
            /> 
            Wind Direction: {windLeft ? "Left" : "Right"}
          </label>
        </div>
        
        <div style={{ marginTop: 10 }}>
          <button 
            onClick={() => setAnimating(prev => !prev)} 
            style={{ padding: '8px 16px' }}
          >
            {animating ? "Pause Animation" : "Start Animation"}
          </button>
        </div>
      </div>
    </div>
  );
}
