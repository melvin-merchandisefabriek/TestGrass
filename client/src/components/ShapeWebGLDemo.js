import React, { useRef, useEffect } from 'react';

// --- Simple homemade math expression parser ---
function evalExpr(expr, vars) {
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
  const keys = Object.keys(vars).concat(Object.keys(safeMath));
  const values = Object.values(vars).concat(Object.values(safeMath));
  // eslint-disable-next-line no-new-func
  return Function(...keys, `return (${expr});`)(...values);
}

// --- Cubic Bézier sampling ---
function cubicBezier(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  return [
    mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0],
    mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1]
  ];
}

// --- Main WebGL shape demo ---
const triangleShape = {
  // Local shape coordinates (SVG-style)
  controlPoints: [
    { id: "tri-top", x: "50+sway*20", y: "0" },
    { id: "tri-right", x: "60", y: "200" },
    { id: "tri-left", x: "40", y: "200" },
    { id: "tri-top-right-c1", x: "50+sway*20", y: "60" },
    { id: "tri-top-right-c2", x: "60+sway*5", y: "120" },
    { id: "tri-left-top-c1", x: "40+sway*5", y: "120 " },
    { id: "tri-left-top-c2", x: "50+sway*20", y: "60" }
  ],
  segments: [
    { type: "bezier", points: ["tri-top", "tri-top-right-c1", "tri-top-right-c2", "tri-right"] },
    { type: "line", points: ["tri-right", "tri-left"] },
    { type: "bezier", points: ["tri-left", "tri-left-top-c1", "tri-left-top-c2", "tri-top"] }
  ],
  fill: [0.1, 0.7, 0.2, 1.0],
  width: 100,
  height: 200
};

const ShapeWebGLDemo = ({ bladeCount = 1, height = '100vh' }) => {
  const canvasRef = useRef(null);
  const animRef = useRef();
  // Single, large, centered blade for debug
  const blades = [
    {
      baseX: 0, // center
      baseY: 0, // center vertically
      scale: 0.8, // fit nicely
      phase: 0,
      speed: 1,
      swayAmount: 1
    }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    // Shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0, 1); }');
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vs));
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, `precision mediump float; void main() { gl_FragColor = vec4(${triangleShape.fill.join(",")}); }`);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
    }
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
    }
    gl.useProgram(program);
    const pos = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pos);
    // Buffers
    const maxVerts = bladeCount * 128; // more for debug points
    const vertArray = new Float32Array(maxVerts * 2);
    const vertBuf = gl.createBuffer();
    // For debug: outline points
    const outlineArray = new Float32Array(maxVerts * 2);
    let outlineLen = 0;

    function draw(t) {
      let vtx = 0;
      outlineLen = 0;
      for (let i = 0; i < blades.length; ++i) {
        const params = blades[i];
        // Animation variables
        const animVars = {
          t,
          ...params,
          sway: Math.sin(t * params.speed + params.phase) * params.swayAmount
        };
        // Evaluate control points in local shape space
        const cp = {};
        for (const pt of triangleShape.controlPoints) {
          cp[pt.id] = [evalExpr(pt.x, animVars), evalExpr(pt.y, animVars)];
        }
        // Map local shape to NDC, centered at (baseX, baseY), scaled
        function toNDC(x, y) {
          // Map (0,0) at center, Y up, X right, both in [-1,1]
          const sx = (x / triangleShape.width - 0.5) * 2 * params.scale;
          const sy = (1 - y / triangleShape.height - 0.5) * 2 * params.scale;
          return [params.baseX + sx, params.baseY + sy];
        }
        // Build outline by sampling segments
        let outline = [];
        for (let s = 0; s < triangleShape.segments.length; ++s) {
          const seg = triangleShape.segments[s];
          if (seg.type === 'line') {
            const a = toNDC(...cp[seg.points[0]]);
            const b = toNDC(...cp[seg.points[1]]);
            if (s === 0) {
              outline.push(a);
              outline.push(b);
            } else {
              outline.push(b);
            }
          } else if (seg.type === 'bezier') {
            const [a, c1, c2, b] = seg.points.map(id => toNDC(...cp[id]));
            const N = 16;
            let bezierPoints = [];
            for (let j = 0; j <= N; ++j) {
              bezierPoints.push(cubicBezier(j / N, a, c1, c2, b));
            }
            if (s === 0) {
              outline.push(bezierPoints[0]);
              outline.push(...bezierPoints.slice(1));
            } else {
              outline.push(...bezierPoints.slice(1)); // skip first to avoid duplicate
            }
          }
        }
        // Ensure outline is closed
        if (outline.length > 2) {
          const first = outline[0], last = outline[outline.length - 1];
          if (Math.abs(first[0] - last[0]) > 1e-6 || Math.abs(first[1] - last[1]) > 1e-6) {
            outline.push(first);
          }
        }
        if (i === 0) {
          console.log('First blade outline:', outline);
        }
        // Triangulate: simple fan from first point
        for (let j = 1; j < outline.length - 1; ++j) {
          vertArray[vtx++] = outline[0][0];
          vertArray[vtx++] = outline[0][1];
          vertArray[vtx++] = outline[j][0];
          vertArray[vtx++] = outline[j][1];
          vertArray[vtx++] = outline[j+1][0];
          vertArray[vtx++] = outline[j+1][1];
        }
        // For debug: store outline points
        for (let j = 0; j < outline.length; ++j) {
          outlineArray[outlineLen++] = outline[j][0];
          outlineArray[outlineLen++] = outline[j][1];
        }
      }
      // Upload and draw triangles
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.clearColor(0.1, 0.1, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, vtx / 2);
      // Draw outline as points for debug
      gl.bufferData(gl.ARRAY_BUFFER, outlineArray, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, outlineLen / 2);
    }

    function animate() {
      const t = performance.now() / 1000;
      draw(t);
      animRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ display: 'block', width: '100vw', height: '100vh' }} />;
};

export default ShapeWebGLDemo;
