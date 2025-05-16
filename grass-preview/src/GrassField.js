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
  const [windAngle, setWindAngle] = React.useState(10 * Math.PI / 180); // 10 degrees in radians
  const [windSpeed, setWindSpeed] = React.useState(0.02);

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

  // Grass blade parameters (now baseY follows ground)
  const blades = [];
  for (let i = 0; i < bladeCount; i++) {
    const baseX = lerp(30, width - 30, i / (bladeCount - 1));
    const baseY = getGroundY(baseX); // This will be at the top of the ground
    // Use clamped heights for bladeLen
    let unclampedLen = lerp(clampedMinHeight, clampedMaxHeight, pseudoRandom(i));
    const maxAllowedLen = baseY - 5; // 5px margin from top
    const bladeLen = Math.min(unclampedLen, maxAllowedLen);
    const curve = lerp(minCurve, maxCurve, pseudoRandom(i + 100));
    const curveAmount = lerp(minCurve, maxCurve, pseudoRandom(i + 800)) / 100; // scale to [0,1]
    const ctrlHeightFrac = lerp(ctrlMinHeight, ctrlMaxHeight, pseudoRandom(i + 700));
    // Wind field position for this blade
    const windT = tick * windSpeed * 60; // scale so windSpeed is similar to before
    const windFieldX = baseX / 80 + Math.cos(windAngle) * windT;
    const windFieldY = baseY / 80 + Math.sin(windAngle) * windT;
    // Sample noise field for wind intensity
    const windNoise = perlin2D(windFieldX, windFieldY); // [0, 1]
    // Wind push vector (direction * magnitude * strength)
    const windPushX = Math.cos(windAngle) * windStrength * windNoise;
    const windPushY = Math.sin(windAngle) * windStrength * windNoise;
    // Random offset along wind direction (for both no-wind and wind-bent)
    const tipRandMag = lerp(0, 8, pseudoRandom(i + 400));
    const tipRandX = Math.cos(windAngle) * tipRandMag;
    const tipRandY = Math.sin(windAngle) * tipRandMag;
    // Calculate no-wind tip position (straight up, plus random along wind direction)
    const tipX_noWind = baseX + tipRandX;
    const tipY_noWind = baseY - bladeLen + tipRandY;
    // Calculate tip position (with wind, before clamping)
    let tipX = baseX + windPushX + tipRandX;
    let tipY = baseY - bladeLen + windPushY + tipRandY;
    // Clamp tip so blade never stretches: enforce distance from base to tip <= bladeLen
    const dx = tipX - baseX;
    const dy = tipY - baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > bladeLen) {
      const scale = bladeLen / dist;
      tipX = baseX + dx * scale;
      tipY = baseY + dy * scale;
    }
    // Control point: always interpolate between no-wind and wind-bent positions
    const ctrlWindFrac = ctrlWindEffect / 100;
    const ctrlFrac = ctrlHeightFrac;
    // No-wind control point (project along no-wind base-to-tip vector, add curve)
    const baseToTipX_noWind = tipX_noWind - baseX;
    const baseToTipY_noWind = tipY_noWind - baseY;
    const ctrlBaseX_noWind = baseX + baseToTipX_noWind * ctrlFrac;
    const ctrlBaseY_noWind = baseY + baseToTipY_noWind * ctrlFrac;
    const perpX_noWind = -baseToTipY_noWind;
    const perpY_noWind = baseToTipX_noWind;
    const perpLen_noWind = Math.sqrt(perpX_noWind * perpX_noWind + perpY_noWind * perpY_noWind) || 1;
    const perpNormX_noWind = perpX_noWind / perpLen_noWind;
    const perpNormY_noWind = perpY_noWind / perpLen_noWind;
    const curveMag = bladeLen * curveAmount * lerp(-1, 1, pseudoRandom(i + 200));
    const ctrlCurveX = ctrlBaseX_noWind + perpNormX_noWind * curveMag;
    const ctrlCurveY = ctrlBaseY_noWind + perpNormY_noWind * curveMag;
    // Wind-bent control point (project along wind-bent base-to-tip vector, no curve)
    const baseToTipX_wind = tipX - baseX;
    const baseToTipY_wind = tipY - baseY;
    const ctrlWindX = baseX + baseToTipX_wind * ctrlFrac;
    const ctrlWindY = baseY + baseToTipY_wind * ctrlFrac;
    // Interpolate between no-wind curve and wind-bent (no curve)
    let ctrlX = lerp(ctrlCurveX, ctrlWindX, ctrlWindFrac);
    let ctrlY = lerp(ctrlCurveY, ctrlWindY, ctrlWindFrac);
    // Clamp ctrlY to not go below baseY
    ctrlY = Math.min(ctrlY, baseY);
    // Calculate left/right offsets for blade width
    // The base should be flat (horizontal), so offset X instead of Y
    const baseYFixed = baseY;
    const halfWidth = bladeWidth / 2;
    const baseLeftX = baseX - halfWidth * baseWidthMultiplier;
    const baseLeftY = baseYFixed;
    const baseRightX = baseX + halfWidth * baseWidthMultiplier;
    const baseRightY = baseYFixed;
    // Control left/right (use wind direction for 3D effect, also scale by curveAmount)
    const ctrlPerpAngle = windAngle + Math.PI / 2;
    const ctrlLeftX = ctrlX + Math.cos(ctrlPerpAngle) * halfWidth * 0.7 * curveAmount;
    const ctrlLeftY = ctrlY + Math.sin(ctrlPerpAngle) * halfWidth * 0.7 * curveAmount;
    const ctrlRightX = ctrlX - Math.cos(ctrlPerpAngle) * halfWidth * 0.7 * curveAmount;
    const ctrlRightY = ctrlY - Math.sin(ctrlPerpAngle) * halfWidth * 0.7 * curveAmount;
    // Path for filled blade (triangle-like)
    const bladePath = `M ${baseLeftX} ${baseLeftY} Q ${ctrlLeftX} ${ctrlLeftY} ${tipX} ${tipY} Q ${ctrlRightX} ${ctrlRightY} ${baseRightX} ${baseRightY} Z`;
    // Color variation
    const green = Math.floor(lerp(120, 180, pseudoRandom(i + 600)));
    const color = `rgb(30,${green},30)`;
    blades.push(
      <path
        key={i}
        d={bladePath}
        fill={color}
        stroke={color}
        strokeWidth={1}
        opacity={0.92}
      />
    );
  }

  // Dialog state
  const [showSettings, setShowSettings] = React.useState(false);

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
                <FoldoutSection title="Grass Field" defaultOpen>
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
                <FoldoutSection title="Wind">
                  <CustomSlider label="Wind Angle" value={Math.round(windAngle * 180 / Math.PI)} setValue={v => setWindAngle(Number(v) * Math.PI / 180)} min={0} max={360} step={1} description="Direction of wind (degrees, 0 = right, 90 = down)" small />
                  <CustomSlider label="Wind Speed" value={windSpeed} setValue={setWindSpeed} min={0.01} max={0.25} step={0.01} description="Speed of wind field movement" small />
                  <CustomSlider label="Wind Strength" value={windStrength} setValue={setWindStrength} min={0} max={60} step={1} description="How much the wind bends the grass tips" small />
                  <CustomSlider label="Ctrl Wind Effect" value={ctrlWindEffect} setValue={setCtrlWindEffect} min={0} max={100} step={1} description="How much wind moves the blade's middle (0% = none, 100% = same as tip)" small />
                </FoldoutSection>
                <FoldoutSection title="Blade Shape">
                  <CustomSlider label="Ctrl Min Height" value={ctrlMinHeight} setValue={setCtrlMinHeight} min={0.3} max={0.9} step={0.01} description="Lowest possible control point (as a fraction of blade height)." small />
                  <CustomSlider label="Ctrl Max Height" value={ctrlMaxHeight} setValue={setCtrlMaxHeight} min={0.4} max={1.0} step={0.01} description="Highest possible control point (as a fraction of blade height)." small />
                  <CustomSlider label="Ctrl Wind Effect" value={ctrlWindEffect} setValue={setCtrlWindEffect} min={0} max={100} step={1} description="How much wind affects the middle control point (0% = none, 100% = same as tip)" small />
                </FoldoutSection>
                <FoldoutSection title="Tree">
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
        // Tree parameters (from state)
        const baseX = width * treeBaseX;
        const baseY = getGroundY(baseX);
        // Recursive function to draw branches (deterministic randomness)
        function drawBranch(x, y, angle, length, width, level, branchSeed = 0) {
          if (level > treeLevels || width < treeMinBranchWidth) return [];
          // End point of this branch
          const endX = x + Math.cos(angle) * length;
          const endY = y - Math.sin(angle) * length;
          // Control point for the curve
          const ctrlX = x + Math.cos(angle) * length * 0.5 + Math.cos(angle + 0.5) * 12 * (1 - level / (treeLevels + 1));
          const ctrlY = y - Math.sin(angle) * length * 0.5 - Math.sin(angle + 0.5) * 12 * (1 - level / (treeLevels + 1));
          // Triangle-like path (like a thick grass blade)
          const halfWidth = width / 2;
          // Base left/right
          const baseLeftX = x - halfWidth;
          const baseLeftY = y;
          const baseRightX = x + halfWidth;
          const baseRightY = y;
          // Control left/right (for thickness at curve)
          const ctrlPerpAngle = angle + Math.PI / 2;
          const ctrlLeftX = ctrlX + Math.cos(ctrlPerpAngle) * halfWidth * 0.7;
          const ctrlLeftY = ctrlY + Math.sin(ctrlPerpAngle) * halfWidth * 0.7;
          const ctrlRightX = ctrlX - Math.cos(ctrlPerpAngle) * halfWidth * 0.7;
          const ctrlRightY = ctrlY - Math.sin(ctrlPerpAngle) * halfWidth * 0.7;
          // Tip (single point)
          const tipX = endX;
          const tipY = endY;
          // Path for filled branch (triangle-like)
          const branchPath = `M ${baseLeftX} ${baseLeftY} Q ${ctrlLeftX} ${ctrlLeftY} ${tipX} ${tipY} Q ${ctrlRightX} ${ctrlRightY} ${baseRightX} ${baseRightY} Z`;
          const color = '#7a4a1a';
          const path = (
            <path
              key={`branch-${x}-${y}-${level}`}
              d={branchPath}
              fill={color}
              stroke={color}
              strokeWidth={1.2}
              opacity={0.97}
            />
          );
          // Branching
          let children = [];
          if (level < treeLevels) {
            const nBranches = treeBranchesPerNode + (level === 0 ? 1 : 0); // Trunk can split into more
            for (let i = 0; i < nBranches; i++) {
              const t = nBranches === 1 ? 0.5 : i / (nBranches - 1);
              const spread = treeBranchSpread * (1 - level / (treeLevels + 1));
              // Use deterministic pseudoRandom for all randomness
              const randBase = branchSeed * 100 + i + level * 1000;
              const branchAng = angle - spread / 2 + t * spread + (pseudoRandom(randBase + 1) - 0.5) * 0.08;
              const branchLen = length * treeBranchScale * lerp(0.85, 1.1, pseudoRandom(randBase + 2));
              const branchW = width * lerp(0.5, 0.7, pseudoRandom(randBase + 3));
              // Branches start at 60-80% up the parent branch
              const bx = lerp(x, endX, lerp(0.6, 0.8, pseudoRandom(randBase + 4)));
              const by = lerp(y, endY, lerp(0.6, 0.8, pseudoRandom(randBase + 5)));
              children = children.concat(drawBranch(bx, by, branchAng, branchLen, branchW, level + 1, randBase));
            }
          }
          return [path, ...children];
        }

        // Draw the main trunk and all branches
        return drawBranch(baseX, baseY, Math.PI / 2, trunkHeight, trunkWidth, 0, 0);
      })()}
      {/* Grass blades */}
      {blades}
    </svg>
  );
}
