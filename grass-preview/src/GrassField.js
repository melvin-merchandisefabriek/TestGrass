import React from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

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

export default function GrassField(props) {
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

  // Tree parameters as stateful sliders
  const [treeBaseX, setTreeBaseX] = React.useState(0.25); // as fraction of width
  const [trunkHeight, setTrunkHeight] = React.useState(180);
  const [trunkWidth, setTrunkWidth] = React.useState(28);
  const [treeLevels, setTreeLevels] = React.useState(6);
  const [treeBranchSpread, setTreeBranchSpread] = React.useState(Math.PI / 1.3); // wider
  const [treeBranchScale, setTreeBranchScale] = React.useState(0.62);
  const [treeMinBranchWidth, setTreeMinBranchWidth] = React.useState(1.2);
  const [treeBranchesPerNode, setTreeBranchesPerNode] = React.useState(3);

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
      minHeight, maxHeight, minCurve, maxCurve, bladeWidth, baseYOffset, groundHeight, borderRadius, ctrlMinHeight, ctrlMaxHeight, windStrength, baseWidthMultiplier, bladeCount, windAngle, windSpeed
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
          minHeight, maxHeight, minCurve, maxCurve, bladeWidth, baseYOffset, groundHeight, borderRadius, ctrlMinHeight, ctrlMaxHeight, windStrength, baseWidthMultiplier, bladeCount, windAngle, windSpeed
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
  }

  // Calculate the maximum allowed blade length for the current field size
  const baseY = height - baseYOffset;
  const maxAllowedLen = Math.max(baseY - 5, 0); // 5px margin from top, never negative
  // Clamp minHeight and maxHeight to maxAllowedLen
  const clampedMinHeight = Math.min(minHeight, maxAllowedLen);
  const clampedMaxHeight = Math.min(maxHeight, maxAllowedLen);

  // Wind parameters
  const [windAngle, setWindAngle] = React.useState(10 * Math.PI / 180); // 10 degrees in radians
  const [windSpeed, setWindSpeed] = React.useState(0.02);

  // Compute ground points for terrain
  const groundPoints = [];
  const groundYBase = height - groundHeight;
  const steps = Math.max(80, Math.floor(width / 4));
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y =
      groundYBase +
      Math.sin((x / width) * Math.PI * 2) * 7 +
      Math.sin((x / width) * Math.PI * 4) * 4 +
      Math.sin((x / width) * Math.PI * 1.2) * 5 +
      Math.sin((x / width) * Math.PI * 0.5 + 1.5) * 3;
    groundPoints.push([x, y]);
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
    const baseY = getGroundY(baseX);
    // Use clamped heights for bladeLen
    let unclampedLen = lerp(clampedMinHeight, clampedMaxHeight, pseudoRandom(i));
    const maxAllowedLen = baseY - 5; // 5px margin from top
    const bladeLen = Math.min(unclampedLen, maxAllowedLen);
    const curve = lerp(minCurve, maxCurve, pseudoRandom(i + 100));
    // Wind field position for this blade
    const windT = tick * windSpeed;
    const windFieldX = baseX / 80 + Math.cos(windAngle) * windT;
    const windFieldY = baseY / 80 + Math.sin(windAngle) * windT;
    // Sample noise field for wind intensity
    const windIntensity = perlin2D(windFieldX, windFieldY) * 2 - 1; // [-1, 1]
    // Wind push vector (direction * intensity * strength)
    const windPushX = Math.cos(windAngle) * windIntensity * windStrength;
    const windPushY = Math.sin(windAngle) * windIntensity * windStrength;
    // Control point (minimal wind, just a little for realism)
    const ctrlHeightFrac = lerp(ctrlMinHeight, ctrlMaxHeight, pseudoRandom(i + 700));
    // Use minCurve/maxCurve to control the amount of curve (bend) for each blade
    const curveAmount = lerp(minCurve, maxCurve, pseudoRandom(i + 800)) / 100; // scale to [0,1]
    const ctrlX = baseX + (windPushX * 0.18 + lerp(-10, 10, pseudoRandom(i + 200))) * curveAmount;
    let ctrlY = baseY - bladeLen * ctrlHeightFrac + (windPushY * 0.12 + lerp(-10, 10, pseudoRandom(i + 300))) * curveAmount;
    let tipY = baseY - bladeLen + windPushY + lerp(-8, 8, pseudoRandom(i + 500));
    // Clamp ctrlY and tipY to not go below baseY
    ctrlY = Math.min(ctrlY, baseY);
    tipY = Math.min(tipY, baseY);
    // Tip (full wind)
    const tipX = baseX + windPushX + lerp(-8, 8, pseudoRandom(i + 400));
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

  // MUI slider helper
  function muiSlider(label, value, setValue, min, max, step = 1, description = "") {
    return (
      <div style={{ marginBottom: 18 }}>
        <Typography gutterBottom variant="body2">{label}: <b>{value}</b></Typography>
        <Slider
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(_, v) => setValue(Number(v))}
          valueLabelDisplay="auto"
        />
        {description && <Typography variant="caption" color="text.secondary">{description}</Typography>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ minWidth: 250, padding: 8 }}>
        {/* Save/Load UI */}
        <button onClick={saveAsDefault} style={{marginBottom: 8}}>Save as Default</button>
        <button onClick={() => setShowPresetDialog(v => !v)} style={{marginLeft: 8, marginBottom: 8}}>
          {showPresetDialog ? 'Hide Presets' : 'Show Presets'}
        </button>
        <Button variant="contained" onClick={() => setShowSettings(true)} style={{marginLeft: 8, marginBottom: 8}}>
          Open Settings
        </Button>
        {showPresetDialog && (
          <div style={{border: '1px solid #bbb', borderRadius: 8, padding: 12, background: '#f8fff8', marginBottom: 12, minWidth: 220}}>
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
      </div>
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Field & Tree Settings</DialogTitle>
        <DialogContent dividers>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><b>Grass Field</b></AccordionSummary>
            <AccordionDetails>
              {muiSlider('Blade Count', bladeCount, v => setBladeCount(Number(v)), 10, 300, 1, 'Number of grass blades in the field')}
              {muiSlider('Min Height', clampedMinHeight, setMinHeight, 5, maxAllowedLen, 1, 'Minimum possible blade height (pixels).')}
              {muiSlider('Max Height', clampedMaxHeight, setMaxHeight, clampedMinHeight, maxAllowedLen, 1, 'Maximum possible blade height (pixels).')}
              {muiSlider('Min Curve', minCurve, setMinCurve, 0, 100, 1, 'Minimum curve (bend) of blades.')}
              {muiSlider('Max Curve', maxCurve, setMaxCurve, 0, 120, 1, 'Maximum curve (bend) of blades.')}
              {muiSlider('Blade Width', bladeWidth, setBladeWidth, 1, 12, 1, 'Thickness of each blade.')}
              {muiSlider('Base Width', baseWidthMultiplier, setBaseWidthMultiplier, 1, 6, 0.01, 'Multiplier for the base thickness of each blade')}
              {muiSlider('Base Y Offset', baseYOffset, setBaseYOffset, 0, 100, 1, 'Vertical offset of grass base from the bottom.')}
              {muiSlider('Ground Height', groundHeight, setGroundHeight, 10, 100, 1, 'Height of the ground area.')}
              {muiSlider('Border Radius', borderRadius, setBorderRadius, 0, 40, 1, 'Corner roundness of the field.')}
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><b>Wind</b></AccordionSummary>
            <AccordionDetails>
              {muiSlider('Wind Angle', Math.round(windAngle * 180 / Math.PI), v => setWindAngle(Number(v) * Math.PI / 180), 0, 360, 1, 'Direction of wind (degrees, 0 = right, 90 = down)')}
              {muiSlider('Wind Speed', windSpeed, setWindSpeed, 0.01, 0.25, 0.01, 'Speed of wind field movement')}
              {muiSlider('Wind Strength', windStrength, setWindStrength, 0, 60, 1, 'How much the wind bends the grass tips')}
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><b>Blade Shape</b></AccordionSummary>
            <AccordionDetails>
              {muiSlider('Ctrl Min Height', ctrlMinHeight, setCtrlMinHeight, 0.3, 0.9, 0.01, 'Lowest possible control point (as a fraction of blade height).')}
              {muiSlider('Ctrl Max Height', ctrlMaxHeight, setCtrlMaxHeight, 0.4, 1.0, 0.01, 'Highest possible control point (as a fraction of blade height).')}
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><b>Tree</b></AccordionSummary>
            <AccordionDetails>
              {muiSlider('Tree X Position', Math.round(treeBaseX * 100), v => setTreeBaseX(Number(v) / 100), 0, 100, 1, 'Horizontal position of tree (percent of width)')}
              {muiSlider('Trunk Height', trunkHeight, setTrunkHeight, 40, 400, 1, 'Height of the main trunk')}
              {muiSlider('Trunk Width', trunkWidth, setTrunkWidth, 4, 60, 0.1, 'Thickness of the main trunk')}
              {muiSlider('Branch Levels', treeLevels, setTreeLevels, 1, 10, 1, 'How many times branches can rebranch')}
              {muiSlider('Branches per Node', treeBranchesPerNode, setTreeBranchesPerNode, 2, 6, 1, 'How many branches split at each node')}
              {muiSlider('Branch Spread', Math.round(treeBranchSpread * 180 / Math.PI), v => setTreeBranchSpread(Number(v) * Math.PI / 180), 10, 180, 1, 'Spread angle of branches (degrees)')}
              {muiSlider('Branch Scale', treeBranchScale, setTreeBranchScale, 0.3, 0.9, 0.01, 'Relative length of each branch compared to its parent')}
              {muiSlider('Min Branch Width', treeMinBranchWidth, setTreeMinBranchWidth, 0.5, 10, 0.1, 'Minimum width for branches (thinner = more detail)')}
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
      <svg
        id="grass-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          background: FIELD_BG_GRADIENT,
          borderRadius: borderRadius,
        }}
      >
        {/* Ground - wavy terrain */}
        {(() => {
          // Compound sinewaves for terrain (static, not animated)
          const points = [];
          const groundYBase = height - groundHeight;
          const steps = Math.max(80, Math.floor(width / 4));
          for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * width;
            // Compound sinewaves (static, no tick)
            const y =
              groundYBase +
              Math.sin((x / width) * Math.PI * 2) * 7 +
              Math.sin((x / width) * Math.PI * 4) * 4 +
              Math.sin((x / width) * Math.PI * 1.2) * 5 +
              Math.sin((x / width) * Math.PI * 0.5 + 1.5) * 3;
            points.push([x, y]);
          }
          // SVG path: start at left, follow points, then close at bottom
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
    </div>
  );
}
