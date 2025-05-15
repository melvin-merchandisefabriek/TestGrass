// Grass field configuration variables
const GRASS_MIN_HEIGHT = 90;
const GRASS_MAX_HEIGHT = 160;
const GRASS_MIN_CURVE = 30;
const GRASS_MAX_CURVE = 60;
const GRASS_BLADE_WIDTH = 4;
const GRASS_BASE_Y_OFFSET = 40;
const GROUND_HEIGHT = 40;
const FIELD_BORDER_RADIUS = 16;
const FIELD_BG_GRADIENT = "linear-gradient(to top, #b3e6b3 0%, #e0ffe0 100%)";

const React = require("react");

// Simple 1D Perlin-like noise (not true Perlin, but good for wind)
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function fade(t) {
  // Perlin fade curve
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function pseudoRandom(seed) {
  // Deterministic pseudo-random for a given seed
  return (Math.sin(seed * 9999.1) * 43758.5453) % 1;
}
function perlin1D(x) {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const t = x - x0;
  const fadeT = fade(t);
  const grad0 = pseudoRandom(x0);
  const grad1 = pseudoRandom(x1);
  return lerp(grad0, grad1, fadeT);
}

function GrassField(props) {
  // State for adjustable parameters
  const [minHeight, setMinHeight] = React.useState(GRASS_MIN_HEIGHT);
  const [maxHeight, setMaxHeight] = React.useState(GRASS_MAX_HEIGHT);
  const [minCurve, setMinCurve] = React.useState(GRASS_MIN_CURVE);
  const [maxCurve, setMaxCurve] = React.useState(GRASS_MAX_CURVE);
  const [bladeWidth, setBladeWidth] = React.useState(GRASS_BLADE_WIDTH);
  const [baseYOffset, setBaseYOffset] = React.useState(GRASS_BASE_Y_OFFSET);
  const [groundHeight, setGroundHeight] = React.useState(GROUND_HEIGHT);
  const [borderRadius, setBorderRadius] = React.useState(FIELD_BORDER_RADIUS);

  const bladeCount = props.bladeCount || 70;
  const width = props.width || 500;
  const height = props.height || 500;
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let running = true;
    function animate() {
      if (!running) return;
      setTick((t) => t + 1);
      requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
    };
  }, []);

  // Grass blade parameters
  const blades = [];
  for (let i = 0; i < bladeCount; i++) {
    const baseX = lerp(30, width - 30, i / (bladeCount - 1));
    const baseY = height - baseYOffset;
    const bladeLen = lerp(minHeight, maxHeight, pseudoRandom(i));
    const curve = lerp(minCurve, maxCurve, pseudoRandom(i + 100));
    // Wind offset using perlin noise
    const windT = tick * 0.015;
    const wind =
      perlin1D(i * 0.18 + windT) * 32 + perlin1D(i * 0.5 + windT * 0.5) * 10;
    // Control point (bend)
    const ctrlX = baseX + wind + lerp(-10, 10, pseudoRandom(i + 200));
    const ctrlY = baseY - bladeLen * 0.6 + lerp(-10, 10, pseudoRandom(i + 300));
    // Tip
    const tipX = baseX + wind * 0.5 + lerp(-8, 8, pseudoRandom(i + 400));
    const tipY = baseY - bladeLen + lerp(-8, 8, pseudoRandom(i + 500));
    // Color variation
    const green = Math.floor(lerp(120, 180, pseudoRandom(i + 600)));
    const color = `rgb(30,${green},30)`;
    blades.push(
      React.createElement("path", {
        key: i,
        d: `M ${baseX} ${baseY} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`,
        stroke: color,
        strokeWidth: bladeWidth,
        fill: "none",
        strokeLinecap: "round",
        opacity: 0.85,
      })
    );
  }

  // Sliders for adjusting parameters
  const sliderStyle = { margin: '8px 0', width: '220px' };
  const labelStyle = { display: 'block', fontSize: '13px', marginBottom: 2 };
  function slider(label, value, setValue, min, max, step = 1) {
    return React.createElement('label', { style: labelStyle },
      `${label}: ${value}`,
      React.createElement('input', {
        type: 'range',
        min,
        max,
        step,
        value,
        onChange: e => setValue(Number(e.target.value)),
        style: sliderStyle
      })
    );
  }

  return React.createElement(
    "div",
    { style: { display: 'flex', gap: 24 } },
    React.createElement(
      "div",
      { style: { minWidth: 250, padding: 8 } },
      slider('Min Height', minHeight, setMinHeight, 40, 200),
      slider('Max Height', maxHeight, setMaxHeight, 60, 300),
      slider('Min Curve', minCurve, setMinCurve, 0, 100),
      slider('Max Curve', maxCurve, setMaxCurve, 0, 120),
      slider('Blade Width', bladeWidth, setBladeWidth, 1, 12),
      slider('Base Y Offset', baseYOffset, setBaseYOffset, 0, 100),
      slider('Ground Height', groundHeight, setGroundHeight, 10, 100),
      slider('Border Radius', borderRadius, setBorderRadius, 0, 40)
    ),
    React.createElement(
      "svg",
      {
        width: width,
        height: height,
        viewBox: `0 0 ${width} ${height}`,
        style: {
          background: FIELD_BG_GRADIENT,
          borderRadius: borderRadius,
        },
      },
      // Ground
      React.createElement("rect", {
        x: 0,
        y: height - groundHeight,
        width: width,
        height: groundHeight,
        fill: "#4b8b3b",
      }),
      // Grass blades
      ...blades
    )
  );
}

module.exports = GrassField;