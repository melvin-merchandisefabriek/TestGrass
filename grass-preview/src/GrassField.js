import React from "react";

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

// 2D Perlin-like noise for wind field
function pseudoRandom2D(x, y) {
  // Combine x and y for a deterministic pseudo-random value
  return (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
}
function perlin2D(x, y) {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;
  const sx = fade(x - x0);
  const sy = fade(y - y0);
  const n00 = pseudoRandom2D(x0, y0);
  const n10 = pseudoRandom2D(x1, y0);
  const n01 = pseudoRandom2D(x0, y1);
  const n11 = pseudoRandom2D(x1, y1);
  const ix0 = lerp(n00, n10, sx);
  const ix1 = lerp(n01, n11, sx);
  return lerp(ix0, ix1, sy);
}

const GRASS_MIN_HEIGHT = 20;
const GRASS_MAX_HEIGHT = 30;
const GRASS_MIN_CURVE = 30;
const GRASS_MAX_CURVE = 60;
const GRASS_BLADE_WIDTH = 4;
const GRASS_BASE_Y_OFFSET = 40;
const GROUND_HEIGHT = 40;
const FIELD_BORDER_RADIUS = 16;
const FIELD_BG_GRADIENT = "linear-gradient(to top, #b3e6b3 0%, #e0ffe0 100%)";

// --- Custom Foldout Section Component ---
function FoldoutSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, border: '1px solid #bbb', borderRadius: 8, background: '#f8fff8' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          cursor: 'pointer',
          padding: '8px 12px',
          fontWeight: 600,
          borderBottom: open ? '1px solid #bbb' : 'none',
          background: open ? '#e8fbe8' : '#f8fff8',
          borderRadius: '8px 8px 0 0',
          userSelect: 'none',
        }}
      >
        {title} <span style={{ float: 'right', fontWeight: 400 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ padding: 12 }}>{children}</div>}
    </div>
  );
}

// --- Custom Slider ---
function CustomSlider({ label, value, setValue, min, max, step = 1, description = "", small }) {
  return (
    <div style={{ marginBottom: small ? 7 : 14 }}>
      <label style={{ fontSize: small ? 12 : 14, fontWeight: 500 }}>
        {label}: <b>{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}</b>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        style={{ width: '100%', height: small ? 18 : 22 }}
      />
      {description && <div style={{ fontSize: small ? 10 : 12, color: '#666', marginTop: 2 }}>{description}</div>}
    </div>
  );
}

// --- Models ---
class GrassBlade {
  constructor({ baseX, baseY, bladeLen, windAngle, windStrength, color, bladeWidth, baseWidthMultiplier }) {
    this.baseX = baseX;
    this.baseY = baseY;
    this.bladeLen = Math.max(0, bladeLen || 0);
    this.windAngle = windAngle || 0;
    this.windStrength = windStrength || 0; // [0,1]
    this.color = color || '#228B22';
    this.bladeWidth = Math.max(0.1, bladeWidth || 1);
    this.baseWidthMultiplier = Math.max(0.1, baseWidthMultiplier || 1);
  }

  // Returns tip position (x, y) on the circle, interpolated between upright and wind direction
  getTip() {
    // Upright: angle = -PI/2 (vertical up)
    // Wind: angle = windAngle
    const uprightAngle = -Math.PI / 2;
    const t = this.windStrength; // [0,1]
    // Interpolate angle
    let tipAngle = uprightAngle + (this.windAngle - uprightAngle) * t;
    // Clamp to never go past wind direction
    if (t > 0) {
      // Only allow interpolation from upright to windAngle
      if (this.windAngle > uprightAngle && tipAngle > this.windAngle) tipAngle = this.windAngle;
      if (this.windAngle < uprightAngle && tipAngle < this.windAngle) tipAngle = this.windAngle;
    }
    const tipX = this.baseX + Math.cos(tipAngle) * this.bladeLen;
    const tipY = this.baseY + Math.sin(tipAngle) * this.bladeLen;
    return { tipX, tipY, tipAngle };
  }

  // Returns control point (x, y) 30% of the way from upright to wind-bent
  getControlPoint() {
    const uprightAngle = -Math.PI / 2;
    const t = this.windStrength * 0.3; // 30% of wind effect
    let ctrlAngle = uprightAngle + (this.windAngle - uprightAngle) * t;
    // Clamp as above
    if (t > 0) {
      if (this.windAngle > uprightAngle && ctrlAngle > this.windAngle) ctrlAngle = this.windAngle;
      if (this.windAngle < uprightAngle && ctrlAngle < this.windAngle) ctrlAngle = this.windAngle;
    }
    const ctrlLen = this.bladeLen * 0.6; // control point is 60% up the blade
    const ctrlX = this.baseX + Math.cos(ctrlAngle) * ctrlLen;
    const ctrlY = this.baseY + Math.sin(ctrlAngle) * ctrlLen;
    return { ctrlX, ctrlY };
  }

  // Returns SVG path for the blade
  getBladePath(tipX, tipY, ctrlX, ctrlY) {
    const baseYFixed = this.baseY;
    const halfWidth = this.bladeWidth / 2;
    const baseLeftX = this.baseX - halfWidth * this.baseWidthMultiplier;
    const baseLeftY = baseYFixed;
    const baseRightX = this.baseX + halfWidth * this.baseWidthMultiplier;
    const baseRightY = baseYFixed;
    // Always use horizontal for base-to-control-point perpendicular offset
    const ctrlLeftX = ctrlX - halfWidth * 0.7;
    const ctrlLeftY = ctrlY;
    const ctrlRightX = ctrlX + halfWidth * 0.7;
    const ctrlRightY = ctrlY;
    return `M ${baseLeftX} ${baseLeftY} Q ${ctrlLeftX} ${ctrlLeftY} ${tipX} ${tipY} Q ${ctrlRightX} ${ctrlRightY} ${baseRightX} ${baseRightY} Z`;
  }
}

class TreeBranch {
  constructor({ x, y, angle, length, width, level, params, pseudoRandom, drawBranch }) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = Math.max(0, length || 0);
    this.width = Math.max(0, width || 0);
    this.level = level || 0;
    this.params = params || {};
    this.pseudoRandom = pseudoRandom;
    this.drawBranch = drawBranch;
  }

  render(keyPrefix = '') {
    try {
      const { treeLevels = 6, treeMinBranchWidth = 1.2, treeBranchesPerNode = 3, treeBranchSpread = Math.PI / 1.3, treeBranchScale = 0.62 } = this.params;
      // Defensive: bail if any value is NaN or not finite
      if (
        typeof this.level !== 'number' ||
        typeof this.width !== 'number' ||
        typeof this.x !== 'number' ||
        typeof this.y !== 'number' ||
        typeof this.angle !== 'number' ||
        typeof this.length !== 'number' ||
        typeof treeLevels !== 'number' ||
        typeof treeMinBranchWidth !== 'number' ||
        typeof treeBranchesPerNode !== 'number' ||
        typeof treeBranchSpread !== 'number' ||
        typeof treeBranchScale !== 'number' ||
        !isFinite(this.x) ||
        !isFinite(this.y) ||
        !isFinite(this.angle) ||
        !isFinite(this.length) ||
        !isFinite(this.width) ||
        !isFinite(treeLevels) ||
        !isFinite(treeMinBranchWidth) ||
        !isFinite(treeBranchesPerNode) ||
        !isFinite(treeBranchSpread) ||
        !isFinite(treeBranchScale) ||
        this.level > treeLevels ||
        this.width < treeMinBranchWidth ||
        treeLevels < 0 ||
        treeMinBranchWidth < 0 ||
        treeBranchesPerNode < 1 ||
        treeBranchSpread < 0 ||
        treeBranchScale <= 0 ||
        this.length <= 0
      ) return [];
      const endX = this.x + Math.cos(this.angle) * this.length;
      const endY = this.y - Math.sin(this.angle) * this.length;
      const ctrlX = this.x + Math.cos(this.angle) * this.length * 0.5 + Math.cos(this.angle + 0.5) * 12 * (1 - this.level / (treeLevels + 1));
      const ctrlY = this.y - Math.sin(this.angle) * this.length * 0.5 - Math.sin(this.angle + 0.5) * 12 * (1 - this.level / (treeLevels + 1));
      const halfWidth = this.width / 2;
      const baseLeftX = this.x - halfWidth;
      const baseLeftY = this.y;
      const baseRightX = this.x + halfWidth;
      const baseRightY = this.y;
      const ctrlPerpAngle = this.angle + Math.PI / 2;
      const ctrlLeftX = ctrlX + Math.cos(ctrlPerpAngle) * halfWidth * 0.7;
      const ctrlLeftY = ctrlY + Math.sin(ctrlPerpAngle) * halfWidth * 0.7;
      const ctrlRightX = ctrlX - Math.cos(ctrlPerpAngle) * halfWidth * 0.7;
      const ctrlRightY = ctrlY - Math.sin(ctrlPerpAngle) * halfWidth * 0.7;
      const tipX = endX;
      const tipY = endY;
      const branchPath = `M ${baseLeftX} ${baseLeftY} Q ${ctrlLeftX} ${ctrlLeftY} ${tipX} ${tipY} Q ${ctrlRightX} ${ctrlRightY} ${baseRightX} ${baseRightY} Z`;
      const color = '#7a4a1a';
      const path = (
        <path
          key={`branch-${keyPrefix}-${this.level}`}
          d={branchPath}
          fill={color}
          stroke={color}
          strokeWidth={1.2}
          opacity={0.97}
        />
      );
      let children = [];
      if (this.level < treeLevels) {
        const nBranches = treeBranchesPerNode + (this.level === 0 ? 1 : 0);
        for (let i = 0; i < nBranches; i++) {
          // Defensive: check for NaN/invalid nBranches
          if (!Number.isFinite(nBranches) || nBranches < 1) break;
          const t = nBranches === 1 ? 0.5 : i / (nBranches - 1);
          const spread = treeBranchSpread * (1 - this.level / (treeLevels + 1));
          const randBase = this.level * 1000 + i;
          const branchAng = this.angle - spread / 2 + t * spread + (this.pseudoRandom(randBase + 1) - 0.5) * 0.08;
          const branchLen = this.length * treeBranchScale * lerp(0.85, 1.1, this.pseudoRandom(randBase + 2));
          const branchW = this.width * lerp(0.5, 0.7, this.pseudoRandom(randBase + 3));
          const bx = lerp(this.x, endX, lerp(0.6, 0.8, this.pseudoRandom(randBase + 4)));
          const by = lerp(this.y, endY, lerp(0.6, 0.8, this.pseudoRandom(randBase + 5)));
          // Defensive: check for NaN/invalid branch params
          if (!Number.isFinite(branchAng) || !Number.isFinite(branchLen) || !Number.isFinite(branchW) || !Number.isFinite(bx) || !Number.isFinite(by)) continue;
          if (branchLen <= 0 || branchW <= 0) continue;
          children = children.concat(this.drawBranch(bx, by, branchAng, branchLen, branchW, this.level + 1, this.params, this.pseudoRandom, this.drawBranch, `${keyPrefix}-${i}`));
        }
      }
      return [path, ...children];
    } catch (err) {
      // Log error to SVG overlay for mobile users
      if (typeof window !== 'undefined') {
        window.__TREE_ERROR__ = err && err.stack ? err.stack : String(err);
      }
      return [
        <text x="10" y="30" fill="red" fontSize="16" key="tree-error" style={{fontFamily:'monospace'}}>
          Tree error: {String(err).slice(0, 80)}
        </text>
      ];
    }
  }
}

export default function GrassField(props) {
  // Inject global style to prevent all scrolling and overflow
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      html, body, #root {
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }
      body > * {
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Responsive width/height for SVG and drawing
  const [viewport, setViewport] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  React.useEffect(() => {
    function handleResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const width = viewport.width;
  const height = viewport.height;

  // State for adjustable parameters
  const [minHeight, setMinHeight] = React.useState(GRASS_MIN_HEIGHT);
  const [maxHeight, setMaxHeight] = React.useState(GRASS_MAX_HEIGHT);
  const [minCurve, setMinCurve] = React.useState(GRASS_MIN_CURVE);
  const [maxCurve, setMaxCurve] = React.useState(GRASS_MAX_CURVE);
  const [bladeWidth, setBladeWidth] = React.useState(GRASS_BLADE_WIDTH);
  const [baseYOffset, setBaseYOffset] = React.useState(GRASS_BASE_Y_OFFSET);
  const [groundHeight, setGroundHeight] = React.useState(GROUND_HEIGHT);
  const [borderRadius, setBorderRadius] = React.useState(FIELD_BORDER_RADIUS);
  const [ctrlMinHeight, setCtrlMinHeight] = React.useState(0.6); // as a fraction of bladeLen
  const [ctrlMaxHeight, setCtrlMaxHeight] = React.useState(0.8);
  const [windStrength, setWindStrength] = React.useState(4);
  const [baseWidthMultiplier, setBaseWidthMultiplier] = React.useState(1.7);
  const [bladeCount, setBladeCount] = React.useState(props.bladeCount || 70);
  const [ctrlWindEffect, setCtrlWindEffect] = React.useState(30); // default 30%

  // Tree parameters as stateful sliders
  const [treeBaseX, setTreeBaseX] = React.useState(0.25); // as fraction of width
  const [trunkHeight, setTrunkHeight] = React.useState(180);
  const [trunkWidth, setTrunkWidth] = React.useState(28);
  const [treeLevels, setTreeLevels] = React.useState(6);
  const [treeBranchSpread, setTreeBranchSpread] = React.useState(Math.PI / 1.3); // wider
  const [treeBranchScale, setTreeBranchScale] = React.useState(0.62);
  const [treeMinBranchWidth, setTreeMinBranchWidth] = React.useState(1.2);
  const [treeBranchesPerNode, setTreeBranchesPerNode] = React.useState(3);

  const [tick, setTick] = React.useState(0);
  const lastTimeRef = React.useRef();
  React.useEffect(() => {
    let running = true;
    function animate(now) {
      if (!running) return;
      if (lastTimeRef.current === undefined) lastTimeRef.current = now;
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1); // seconds, clamp to 0.1s max
      lastTimeRef.current = now;
      setTick(t => t + delta);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => {
      running = false;
    };
  }, []);

  // Wind parameters
  const [windLeft, setWindLeft] = React.useState(false); // false = right, true = left
  // Wind angle: 0 (to right) or 180deg (to left)
  // We want wind to go TO the left (180deg) or TO the right (0deg)
  const windAngle = windLeft ? Math.PI : 0;

  // UI state for settings dialog
  const [showSettings, setShowSettings] = React.useState(false);

  // Preset state and helpers
  const [presets, setPresets] = React.useState(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('grassPresets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showPresetDialog, setShowPresetDialog] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");

  // Save current as default
  function saveAsDefault() {
    localStorage.setItem('grassDefaults', JSON.stringify({
      minHeight, maxHeight, minCurve, maxCurve, bladeWidth, baseYOffset, groundHeight, borderRadius, ctrlMinHeight, ctrlMaxHeight, windStrength, baseWidthMultiplier, bladeCount, windAngle, windSpeed,
      ctrlWindEffect,
      treeBaseX, trunkHeight, trunkWidth, treeLevels, treeBranchSpread, treeBranchScale, treeMinBranchWidth, treeBranchesPerNode
    }));
  }
  // Load default on mount
  React.useEffect(() => {
    try {
      const def = localStorage.getItem('grassDefaults');
      if (def) {
        const d = JSON.parse(def);
        setMinHeight(d.minHeight);
        setMaxHeight(d.maxHeight);
        setMinCurve(d.minCurve);
        setMaxCurve(d.maxCurve);
        setBladeWidth(d.bladeWidth);
        setBaseYOffset(d.baseYOffset);
        setGroundHeight(d.groundHeight);
        setBorderRadius(d.borderRadius);
        setCtrlMinHeight(d.ctrlMinHeight);
        setCtrlMaxHeight(d.ctrlMaxHeight);
        setWindStrength(d.windStrength);
        setBaseWidthMultiplier(d.baseWidthMultiplier);
        setBladeCount(d.bladeCount);
        setWindAngle(d.windAngle);
        setWindSpeed(d.windSpeed);
        if (d.ctrlWindEffect !== undefined) setCtrlWindEffect(d.ctrlWindEffect);
        if (d.treeBaseX !== undefined) setTreeBaseX(d.treeBaseX);
        if (d.trunkHeight !== undefined) setTrunkHeight(d.trunkHeight);
        if (d.trunkWidth !== undefined) setTrunkWidth(d.trunkWidth);
        if (d.treeLevels !== undefined) setTreeLevels(d.treeLevels);
        if (d.treeBranchSpread !== undefined) setTreeBranchSpread(d.treeBranchSpread);
        if (d.treeBranchScale !== undefined) setTreeBranchScale(d.treeBranchScale);
        if (d.treeMinBranchWidth !== undefined) setTreeMinBranchWidth(d.treeMinBranchWidth);
        if (d.treeBranchesPerNode !== undefined) setTreeBranchesPerNode(d.treeBranchesPerNode);
      }
    } catch {}
  }, []);

  // Save current as a named preset
  function savePreset() {
    if (!presetName.trim()) return;
    const newPresets = [
      ...presets.filter(p => p.name !== presetName.trim()),
      {
        name: presetName.trim(),
        values: {
          minHeight, maxHeight, minCurve, maxCurve, bladeWidth, baseYOffset, groundHeight, borderRadius, ctrlMinHeight, ctrlMaxHeight, windStrength, baseWidthMultiplier, bladeCount, windAngle, windSpeed,
          ctrlWindEffect,
          treeBaseX, trunkHeight, trunkWidth, treeLevels, treeBranchSpread, treeBranchScale, treeMinBranchWidth, treeBranchesPerNode
        }
      }
    ];
    setPresets(newPresets);
    localStorage.setItem('grassPresets', JSON.stringify(newPresets));
    setPresetName("");
  }
  // Load a preset
  function loadPreset(values) {
    setMinHeight(values.minHeight);
    setMaxHeight(values.maxHeight);
    setMinCurve(values.minCurve);
    setMaxCurve(values.maxCurve);
    setBladeWidth(values.bladeWidth);
    setBaseYOffset(values.baseYOffset);
    setGroundHeight(values.groundHeight);
    setBorderRadius(values.borderRadius);
    setCtrlMinHeight(values.ctrlMinHeight);
    setCtrlMaxHeight(values.ctrlMaxHeight);
    setWindStrength(values.windStrength);
    setBaseWidthMultiplier(values.baseWidthMultiplier);
    setBladeCount(values.bladeCount);
    setWindAngle(values.windAngle);
    setWindSpeed(values.windSpeed);
    if (values.ctrlWindEffect !== undefined) setCtrlWindEffect(values.ctrlWindEffect);
    if (values.treeBaseX !== undefined) setTreeBaseX(values.treeBaseX);
    if (values.trunkHeight !== undefined) setTrunkHeight(values.trunkHeight);
    if (values.trunkWidth !== undefined) setTrunkWidth(values.trunkWidth);
    if (values.treeLevels !== undefined) setTreeLevels(values.treeLevels);
    if (values.treeBranchSpread !== undefined) setTreeBranchSpread(values.treeBranchSpread);
    if (values.treeBranchScale !== undefined) setTreeBranchScale(values.treeBranchScale);
    if (values.treeMinBranchWidth !== undefined) setTreeMinBranchWidth(values.treeMinBranchWidth);
    if (values.treeBranchesPerNode !== undefined) setTreeBranchesPerNode(values.treeBranchesPerNode);
  }

  // Calculate the base Y for grass and tree: always at the top of the ground
  const baseYField = height - groundHeight;
  // Clamp minHeight and maxHeight to not exceed the available space above the ground
  const maxAllowedLen = Math.max(baseYField - 5, 0); // 5px margin from top, never negative
  const clampedMinHeight = Math.min(minHeight, maxAllowedLen);
  const clampedMaxHeight = Math.min(maxHeight, maxAllowedLen);

  // Compute ground points for terrain
  const groundPoints = [];
  const groundYBase = height - groundHeight;
  const steps = Math.max(80, Math.floor(width / 4));
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    // Compound sinewaves for terrain, but always start at groundYBase and never go below groundYBase
    const y = groundYBase +
      Math.sin((x / width) * Math.PI * 2) * 7 +
      Math.sin((x / width) * Math.PI * 4) * 4 +
      Math.sin((x / width) * Math.PI * 1.2) * 5 +
      Math.sin((x / width) * Math.PI * 0.5 + 1.5) * 3;
    groundPoints.push([x, Math.min(y, groundYBase)]); // Clamp to top of ground
  }

  // Helper to get ground Y at any X by linear interpolation
  function getGroundY(x) {
    if (x <= 0) return groundPoints[0][1];
    if (x >= width) return groundPoints[groundPoints.length - 1][1];
    const idx = (x / width) * steps;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, groundPoints.length - 1);
    const t = idx - i0;
    return lerp(groundPoints[i0][1], groundPoints[i1][1], t);
  }

  // For each blade, draw a reference circle and highlight the allowed quarter (1 for right, 4 for left)
  const allowedTipArcs = [];
  for (let i = 0; i < bladeCount; i++) {
    const baseX = lerp(30, width - 30, i / (bladeCount - 1));
    const baseY = getGroundY(baseX);
    let unclampedLen = lerp(clampedMinHeight, clampedMaxHeight, pseudoRandom(i));
    const maxAllowedLen = baseY - 5;
    const bladeLen = Math.min(unclampedLen, maxAllowedLen);
    // Draw the reference circle at the base
    allowedTipArcs.push(
      <circle
        key={`blade-refcircle-${i}`}
        cx={baseX}
        cy={baseY}
        r={bladeLen}
        fill="none"
        stroke="#c22"
        strokeWidth={1.1}
        opacity={0.18}
        strokeDasharray="2 2"
      />
    );
    // Highlight the allowed quarter: 1 (top-right, right wind), 4 (top-left, left wind)
    // Quarter 1: 0° to 90° (right wind), Quarter 4: 270° to 360° (left wind)
    let arcStartDeg, arcEndDeg;
    if (windLeft) {
      arcStartDeg = 270;
      arcEndDeg = 360;
    } else {
      arcStartDeg = 0;
      arcEndDeg = 90;
    }
    allowedTipArcs.push(
      <path
        key={`blade-allowed-quarter-${i}`}
        d={describeArc(baseX, baseY, bladeLen, arcStartDeg, arcEndDeg)}
        fill="#c22"
        opacity={0.13}
        stroke="none"
      />
    );
    // Draw quarter numbers (1-4) on the blade's reference circle
    const quarterLabels = [
      { n: 1, angle: 45 },   // Top-right
      { n: 2, angle: 135 },  // Bottom-right
      { n: 3, angle: 225 },  // Bottom-left
      { n: 4, angle: 315 }   // Top-left
    ];
    quarterLabels.forEach(({ n, angle }) => {
      const rad = (angle - 90) * Math.PI / 180;
      const qx = baseX + Math.cos(rad) * (bladeLen * 0.65);
      const qy = baseY + Math.sin(rad) * (bladeLen * 0.65);
      allowedTipArcs.push(
        <text key={`blade-qnum-${i}-${n}`} x={qx} y={qy} fontSize={bladeLen * 0.28} fill="#c22" textAnchor="middle" alignmentBaseline="middle" style={{fontFamily:'monospace',fontWeight:700,opacity:0.32}}>{n}</text>
      );
    });
  }

  // Grass blade parameters (now baseY follows ground)
  const blades = [];
  for (let i = 0; i < bladeCount; i++) {
    const baseX = lerp(30, width - 30, i / (bladeCount - 1));
    const baseY = getGroundY(baseX);
    let unclampedLen = lerp(clampedMinHeight, clampedMaxHeight, pseudoRandom(i));
    const maxAllowedLen = baseY - 5;
    const bladeLen = Math.min(unclampedLen, maxAllowedLen);
    // Wind field
    const windT = tick * windSpeed * 60;
    // Wind vector: always points TO the direction (right or left)
    const windFieldX = baseX / 80 + Math.cos(windAngle) * windT;
    const windFieldY = baseY / 80 + Math.sin(windAngle) * windT;
    const windStrengthNorm = Math.max(0, Math.min(1, perlin2D(windFieldX, windFieldY)));
    const green = Math.floor(lerp(120, 180, pseudoRandom(i + 600)));
    const color = `rgb(30,${green},30)`;
    // Adjust windAngle for blade so 0° (right) and 180° (left) match wind TO direction
    const bladeWindAngle = windAngle - Math.PI / 2;
    const blade = new GrassBlade({ baseX, baseY, bladeLen, windAngle: bladeWindAngle, windStrength: windStrengthNorm, color, bladeWidth, baseWidthMultiplier });
    const tip = blade.getTip();
    const ctrl = blade.getControlPoint();
    const bladePath = blade.getBladePath(tip.tipX, tip.tipY, ctrl.ctrlX, ctrl.ctrlY);
    blades.push(
      <path
        key={i}
        d={bladePath}
        fill={color}
        strokeWidth={1}
        opacity={0.92}
        stroke={color}
      />
    );
  }

  return (
    <svg
      id="grass-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        display: 'block', position: 'fixed', top: 0, left: 0,
        background: FIELD_BG_GRADIENT,
        borderRadius: borderRadius,
        overflow: 'hidden',
        maxWidth: '100vw',
        maxHeight: '100vh',
        zIndex: 0,
      }}
    >
      {/* Error overlay always visible at top if error exists */}
      {typeof window !== 'undefined' && window.__TREE_ERROR__ && (
        <g>
          <rect x="0" y="0" width={width} height="40" fill="#fff8" />
          <text x="10" y="28" fill="red" fontSize="18" style={{fontFamily:'monospace'}}>
            {window.__TREE_ERROR__}
          </text>
        </g>
      )}
      {/* UI overlays inside SVG, clipped by border */}
      <foreignObject x="0" y="0" width={width} height={height} style={{pointerEvents: 'none'}}>
        {/* Overlay container: flex column, no absolute positioning */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, margin: 10, pointerEvents: 'none', width: 'auto', maxWidth: '100%' }}>
          {/* Buttons above display */}
          <div style={{ display: 'flex', gap: 10, pointerEvents: 'auto', width: 'auto', maxWidth: '100%' }}>
            <button onClick={saveAsDefault} style={{fontSize: 13, padding: '4px 10px', borderRadius: 6, border: '1px solid #bbb', background: '#e8fbe8', fontWeight: 600}}>Save as Default</button>
            <button onClick={() => setShowPresetDialog(v => !v)} style={{fontSize: 13, padding: '4px 10px', borderRadius: 6, border: '1px solid #bbb', background: '#f8fff8', fontWeight: 600}}>
              {showPresetDialog ? 'Hide Presets' : 'Show Presets'}
            </button>
            <button onClick={() => setShowSettings(true)} style={{fontSize: 13, padding: '4px 10px', borderRadius: 6, border: '1px solid #bbb', background: '#e8fbe8', fontWeight: 600}}>Settings</button>
          </div>
          {/* Preset dialog (floating, below buttons) */}
          {showPresetDialog && (
            <div style={{border: '1px solid #bbb', borderRadius: 8, padding: 12, background: '#f8fff8', minWidth: 220, maxWidth: 320, maxHeight: '60vh', overflowY: 'auto', boxSizing: 'border-box', pointerEvents: 'auto'}}>
              <div style={{fontWeight: 600, marginBottom: 6}}>Presets</div>
              <div style={{marginBottom: 8}}>
                <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name" style={{width: '70%', marginRight: 4}} />
                <button onClick={savePreset} style={{fontSize: 13}}>Save</button>
              </div>
              {presets.length === 0 && <div style={{fontSize: 13, color: '#888'}}>No presets saved.</div>}
              {presets.map(p => (
                <div key={p.name} style={{display: 'flex', alignItems: 'center', marginBottom: 4}}>
                  <button onClick={() => loadPreset(p.values)} style={{marginRight: 8, fontSize: 13}}>{p.name}</button>
                  <button onClick={() => {
                    const filtered = presets.filter(pr => pr.name !== p.name);
                    setPresets(filtered);
                    localStorage.setItem('grassPresets', JSON.stringify(filtered));
                  }} style={{fontSize: 13, color: '#a00'}}>Delete</button>
                </div>
              ))}
            </div>
          )}
          {/* Settings dialog: full height, left side overlay, but no absolute/fixed */}
          {showSettings && (
            <div style={{
              background: '#fff', border: '1px solid #bbb', borderRadius: 8, boxShadow: '2px 0 16px #0002', display: 'flex', flexDirection: 'column',
              maxHeight: '80vh', overflow: 'hidden', boxSizing: 'border-box', pointerEvents: 'auto', minWidth: 320, width: 340
            }}>
              <div style={{
                position: 'sticky', top: 0, zIndex: 2, background: '#e8fbe8', borderBottom: '1px solid #bbb',
                padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                minHeight: 0
              }}>
                <span style={{fontWeight: 700, fontSize: 15}}>Settings</span>
                <button onClick={() => setShowSettings(false)} style={{fontWeight: 600, background: '#e8fbe8', border: '1px solid #bbb', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontSize: 13}}>Close</button>
              </div>
              <div style={{padding: '10px 12px', fontSize: 12, flex: 1, minHeight: 0, overflowY: 'auto', maxHeight: 'calc(80vh - 48px)'}}>
                <FoldoutSection title="Grass Field" defaultOpen={false}>
                  <CustomSlider label="Blade Count" value={bladeCount} setValue={v => setBladeCount(Number(v))} min={10} max={300} step={1} description="Number of grass blades in the field" small />
                  <CustomSlider label="Min Height" value={clampedMinHeight} setValue={setMinHeight} min={5} max={maxAllowedLen} step={1} description="Minimum possible blade height (pixels)." small />
                  <CustomSlider label="Max Height" value={clampedMaxHeight} setValue={setMaxHeight} min={clampedMinHeight} max={maxAllowedLen} step={1} description="Maximum possible blade height (pixels)." small />
                  <CustomSlider label="Min Curve" value={minCurve} setValue={setMinCurve} min={0} max={100} step={1} description="Minimum curve (bend) of blades." small />
                  <CustomSlider label="Max Curve" value={maxCurve} setValue={setMaxCurve} min={0} max={120} step={1} description="Maximum curve (bend) of blades." small />
                  <CustomSlider label="Blade Width" value={bladeWidth} setValue={setBladeWidth} min={1} max={12} step={1} description="Thickness of each blade." small />
                  <CustomSlider label="Base Width" value={baseWidthMultiplier} setValue={setBaseWidthMultiplier} min={1} max={6} step={0.01} description="Multiplier for the base thickness of each blade" small />
                  <CustomSlider label="Base Y Offset" value={baseYOffset} setValue={setBaseYOffset} min={0} max={100} step={1} description="Vertical offset of grass base from the bottom." small />
                  <CustomSlider label="Ground Height" value={groundHeight} setValue={setGroundHeight} min={10} max={100} step={1} description="Height of the ground area." small />
                  <CustomSlider label="Border Radius" value={borderRadius} setValue={setBorderRadius} min={0} max={40} step={1} description="Corner roundness of the field." small />
                </FoldoutSection>
                <FoldoutSection title="Wind" defaultOpen={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Wind Direction:</span>
                    <button
                      onClick={() => setWindLeft(false)}
                      style={{
                        fontWeight: windLeft ? 400 : 700,
                        background: windLeft ? '#f8fff8' : '#e8fbe8',
                        border: '1px solid #bbb',
                        borderRadius: 6,
                        padding: '4px 14px',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Right
                    </button>
                    <button
                      onClick={() => setWindLeft(true)}
                      style={{
                        fontWeight: windLeft ? 700 : 400,
                        background: windLeft ? '#e8fbe8' : '#f8fff8',
                        border: '1px solid #bbb',
                        borderRadius: 6,
                        padding: '4px 14px',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Left
                    </button>
                  </div>
                  <CustomSlider label="Wind Speed" value={windSpeed} setValue={setWindSpeed} min={0.01} max={0.25} step={0.01} description="Speed of wind field movement" small />
                  <CustomSlider label="Wind Strength" value={windStrength} setValue={setWindStrength} min={0} max={60} step={1} description="How much the wind bends the grass tips" small />
                  <CustomSlider label="Ctrl Wind Effect" value={ctrlWindEffect} setValue={setCtrlWindEffect} min={0} max={100} step={1} description="How much wind moves the blade's middle (0% = none, 100% = same as tip)" small />
                </FoldoutSection>
                <FoldoutSection title="Blade Shape" defaultOpen={false}>
                  <CustomSlider label="Ctrl Min Height" value={ctrlMinHeight} setValue={setCtrlMinHeight} min={0.3} max={0.9} step={0.01} description="Lowest possible control point (as a fraction of blade height)." small />
                  <CustomSlider label="Ctrl Max Height" value={ctrlMaxHeight} setValue={setCtrlMaxHeight} min={0.4} max={1.0} step={0.01} description="Highest possible control point (as a fraction of blade height)." small />
                  <CustomSlider label="Ctrl Wind Effect" value={ctrlWindEffect} setValue={setCtrlWindEffect} min={0} max={100} step={1} description="How much wind affects the middle control point (0% = none, 100% = same as tip)" small />
                </FoldoutSection>
                <FoldoutSection title="Tree" defaultOpen={false}>
                  <CustomSlider label="Tree X Position" value={Math.round(treeBaseX * 100)} setValue={v => setTreeBaseX(Number(v) / 100)} min={0} max={100} step={1} description="Horizontal position of tree (percent of width)" small />
                  <CustomSlider label="Trunk Height" value={trunkHeight} setValue={setTrunkHeight} min={40} max={400} step={1} description="Height of the main trunk" small />
                  <CustomSlider label="Trunk Width" value={trunkWidth} setValue={setTrunkWidth} min={4} max={60} step={0.1} description="Thickness of the main trunk" small />
                  <CustomSlider label="Branch Levels" value={treeLevels} setValue={setTreeLevels} min={1} max={10} step={1} description="How many times branches can rebranch" small />
                  <CustomSlider label="Branches per Node" value={treeBranchesPerNode} setValue={setTreeBranchesPerNode} min={2} max={6} step={1} description="How many branches split at each node" small />
                  <CustomSlider label="Branch Spread" value={Math.round(treeBranchSpread * 180 / Math.PI)} setValue={v => setTreeBranchSpread(Number(v) * Math.PI / 180)} min={10} max={180} step={1} description="Spread angle of branches (degrees)" small />
                  <CustomSlider label="Branch Scale" value={treeBranchScale} setValue={setTreeBranchScale} min={0.3} max={0.9} step={0.01} description="Relative length of each branch compared to its parent" small />
                  <CustomSlider label="Min Branch Width" value={treeMinBranchWidth} setValue={setTreeMinBranchWidth} min={0.5} max={10} step={0.1} description="Minimum width for branches (thinner = more detail)" small />
                </FoldoutSection>
              </div>
            </div>
          )}
        </div>
      </foreignObject>
      {/* Ground - wavy terrain */}
      {(() => {
        // Compound sinewaves for terrain (static, not animated)
        const points = [];
        for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * width;
          const y = groundPoints[i][1];
          points.push([x, y]);
        }
        // SVG path: start at left bottom, up to ground, then right bottom
        let path = `M 0 ${height} L ${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length; i++) {
          path += ` L ${points[i][0]} ${points[i][1]}`;
        }
        path += ` L ${width} ${height} Z`;
        return (
          <path
            d={path}
            fill="#4b8b3b"
            stroke="#39702a"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 2px 6px #2a4d1a44)' }}
          />
        );
      })()}
      {/* Tree - recursive trunk and branches */}
      {(() => {
        try {
          const baseX = width * treeBaseX;
          const baseY = getGroundY(baseX);
          const params = { treeLevels, treeMinBranchWidth, treeBranchesPerNode, treeBranchSpread, treeBranchScale };
          function drawBranch(x, y, angle, length, width, level, params, pseudoRandom, drawBranch, keyPrefix = '') {
            if (!isFinite(x) || !isFinite(y) || !isFinite(angle) || !isFinite(length) || !isFinite(width) || level > (params.treeLevels || 6) + 2) return [];
            const branch = new TreeBranch({ x, y, angle, length, width, level, params, pseudoRandom, drawBranch });
            return branch.render(keyPrefix);
          }
          return drawBranch(baseX, baseY, Math.PI / 2, trunkHeight, trunkWidth, 0, params, pseudoRandom, drawBranch);
        } catch (e) {
          return null;
        }
      })()}
      {/* Grass blades */}
      {/* Allowed tip region arcs (debug) */}
      {allowedTipArcs}
      {blades}
      {/* Debug: Angle reference circle in the middle of the screen */}
      <g>
        {(() => {
          const cx = width / 2;
          const cy = height / 2;
          const r = 120;
          // Draw main circle
          const elements = [
            <circle key="main" cx={cx} cy={cy} r={r} fill="none" stroke="#888" strokeWidth={2} opacity={0.5} />
          ];
          // Draw axes: up, right, down, left (rotated 90° counterclockwise)
          const axisLabels = [
            { angle: 270, label: "Up (0°)" },
            { angle: 0, label: "Right (90°)" },
            { angle: 90, label: "Down (180°)" },
            { angle: 180, label: "Left (270°/-90°)" }
          ];
          axisLabels.forEach(({ angle, label }, i) => {
            const rad = (angle) * Math.PI / 180;
            const x = cx + Math.cos(rad) * r;
            const y = cy + Math.sin(rad) * r;
            elements.push(
              <line key={`axis-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#444" strokeWidth={1.5} strokeDasharray="4 2" />
            );
            // Label
            const lx = cx + Math.cos(rad) * (r + 28);
            const ly = cy + Math.sin(rad) * (r + 28);
            elements.push(
              <text key={`label-${i}`} x={lx} y={ly} fontSize={16} fill="#222" textAnchor="middle" alignmentBaseline="middle" style={{fontFamily:'monospace',fontWeight:600}}>{label}</text>
            );
          });
          // Draw degree ticks every 30° (rotated 90° counterclockwise)
          for (let deg = 0; deg < 360; deg += 30) {
            const rad = (deg - 90) * Math.PI / 180;
            const x1 = cx + Math.cos(rad) * (r - 8);
            const y1 = cy + Math.sin(rad) * (r - 8);
            const x2 = cx + Math.cos(rad) * (r + 8);
            const y2 = cy + Math.sin(rad) * (r + 8);
            elements.push(
              <line key={`tick-${deg}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#aaa" strokeWidth={1} />
            );
            // Degree label
            const lx = cx + Math.cos(rad) * (r + 36);
            const ly = cy + Math.sin(rad) * (r + 36);
            elements.push(
              <text key={`deg-${deg}`} x={lx} y={ly} fontSize={13} fill="#555" textAnchor="middle" alignmentBaseline="middle" style={{fontFamily:'monospace'}}>{deg}°</text>
            );
          }
          // Draw quarter numbers (1-4) on the reference circle
          const quarterLabels = [
            { n: 1, angle: 45 },   // Top-right
            { n: 2, angle: 135 },  // Bottom-right
            { n: 3, angle: 225 },  // Bottom-left
            { n: 4, angle: 315 }   // Top-left
          ];
          quarterLabels.forEach(({ n, angle }) => {
            const rad = (angle - 90) * Math.PI / 180;
            const qx = cx + Math.cos(rad) * (r * 0.65);
            const qy = cy + Math.sin(rad) * (r * 0.65);
            elements.push(
              <text key={`qnum-${n}`} x={qx} y={qy} fontSize={32} fill="#c22" textAnchor="middle" alignmentBaseline="middle" style={{fontFamily:'monospace',fontWeight:700,opacity:0.45}}>{n}</text>
            );
          });
          return elements;
        })()}
      </g>
      {/* Wind indicator overlay (top right corner) */}
      <g style={{ pointerEvents: 'none' }}>
        <foreignObject x={width - 150 - 18} y={18} width={150} height={110} style={{ pointerEvents: 'none' }}>
          <div style={{
            width: 150,
            height: 110,
            background: 'rgba(255,255,255,0.82)',
            borderRadius: 12,
            boxShadow: '0 2px 8px #0002',
            border: '1px solid #bbb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            fontSize: 15,
            color: '#234',
            fontWeight: 500,
            gap: 2,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            <span style={{ fontSize: 13, color: '#456', fontWeight: 600, marginBottom: 2 }}>Wind Direction</span>
            <svg width="60" height="60" style={{ display: 'block', margin: 0 }}>
              <g transform="translate(30,30)">
                {/* Draw allowed tip region arc (debug, mini) */}
                <path d={describeArc(0, 0, 22, windLeft ? 180 : -90, windLeft ? -90 : 0)} fill="none" stroke="#000" strokeWidth="2" opacity="0.22" strokeDasharray="3 3" />
                {/* Draw wind direction arrow */}
                <g transform={`rotate(${((windAngle * 180 / Math.PI) - 90).toFixed(1)})`}>
                  <line x1="0" y1="0" x2="0" y2="-16" stroke="#1a7ed6" strokeWidth="3" strokeLinecap="round" />
                  <polygon points="-5,-16 0,-26 5,-16" fill="#1a7ed6" />
                </g>
              </g>
            </svg>
            <span style={{ fontSize: 13, color: '#234', fontWeight: 500 }}>Strength: <b>{windStrength}</b></span>
          </div>
        </foreignObject>
      </g>
      {/* Noise map overlay: transparent, above all */}
      <g style={{ pointerEvents: 'none' }}>
        {(() => {
          // Draw a grid of small rects, each colored by perlin2D at that point
          const cellSize = 16; // px
          const cols = Math.ceil(width / cellSize);
          const rows = Math.ceil(height / cellSize);
          const windT = tick * windSpeed * 60;
          const elements = [];
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              // Wind vector: always points TO the direction (right or left)
              const px = x * cellSize + cellSize / 2;
              const py = y * cellSize + cellSize / 2;
              const windFieldX = px / 80 + Math.cos(windAngle) * windT;
              const windFieldY = py / 80 + Math.sin(windAngle) * windT;
              let v = perlin2D(windFieldX, windFieldY);
              v = Math.max(0, Math.min(1, v));
              const gray = Math.round(v * 255);
              elements.push(
                <rect
                  key={`nmap-${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={`rgba(${gray},${gray},${gray},0.18)`}
                  stroke="none"
                />
              );
            }
          }
          return elements;
        })()}
      </g>
    </svg>
  );
}

// Helper to describe an SVG arc (for the allowed quadrant)
function describeArc(cx, cy, r, startAngle, endAngle) {
  // Angles in degrees
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  // Use absolute difference for largeArcFlag to handle negative/reversed arcs correctly
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");
}
function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = (angleDeg - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  };
}
