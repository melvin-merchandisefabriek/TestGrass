import React, { useRef, useEffect } from 'react';

// --- Simple homemade math expression parser ---
function evalExpr(expr, vars) {
  // Only allow a safe subset of Math and variables
  const safeMath = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    pow: Math.pow,
    PI: Math.PI,
    E: Math.E
  };
  // Build a function with the allowed variables
  const keys = Object.keys(vars).concat(Object.keys(safeMath));
  const values = Object.values(vars).concat(Object.values(safeMath));
  // eslint-disable-next-line no-new-func
  return Function(...keys, `return (${expr});`)(...values);
}

// --- Blade shape/animation config ---
const bladeConfig = {
  controlPoints: [
    { x: 'baseX - width/2', y: 'baseY' }, // base left
    { x: 'baseX', y: 'baseY - height + sway' }, // tip
    { x: 'baseX + width/2', y: 'baseY' } // base right
  ],
  animation: {
    sway: 'sin(t * speed + phase) * swayAmount'
  }
};

// --- Main WebGL grass demo ---
const GrassBladeWebGLDemo = ({ bladeCount = 100, height = '100vh' }) => {
  const canvasRef = useRef(null);
  const animRef = useRef();
  // Per-blade parameters
  const blades = Array.from({ length: bladeCount }, (_, i) => ({
    baseX: (i / bladeCount) * 2 - 1, // NDC X in [-1,1]
    baseY: -0.8 + Math.random() * 0.1, // NDC Y
    width: 0.01 + Math.random() * 0.01,
    height: 0.15 + Math.random() * 0.05,
    phase: Math.random() * Math.PI * 2,
    speed: 1 + Math.random() * 0.5,
    swayAmount: 0.05 + Math.random() * 0.03
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    // Shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0, 1); }');
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision mediump float; void main() { gl_FragColor = vec4(0.1, 0.7, 0.2, 1.0); }');
    gl.compileShader(fs);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    const pos = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pos);
    // Buffers
    const maxVerts = bladeCount * 3;
    const vertArray = new Float32Array(maxVerts * 2);
    const vertBuf = gl.createBuffer();

    function draw(t) {
      let vtx = 0;
      for (let i = 0; i < bladeCount; ++i) {
        const params = blades[i];
        // Evaluate animation variables
        const animVars = {
          t,
          ...params,
          ...Object.fromEntries(
            Object.entries(bladeConfig.animation).map(([k, expr]) => [k, evalExpr(expr, { t, ...params })])
          )
        };
        // Compute control points
        bladeConfig.controlPoints.forEach(pt => {
          vertArray[vtx++] = evalExpr(pt.x, animVars);
          vertArray[vtx++] = evalExpr(pt.y, animVars);
        });
      }
      // Upload and draw
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.clearColor(0.1, 0.1, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, bladeCount * 3);
    }

    function animate() {
      const t = performance.now() / 1000;
      draw(t);
      animRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [bladeCount]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />;
};

export default GrassBladeWebGLDemo;
