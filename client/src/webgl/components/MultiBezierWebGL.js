import React, { useRef, useEffect } from 'react';

const MultiBezierWebGL = ({ curves, height = '100vh' }) => {
  const canvasRef = useRef(null);
  const animRef = useRef();
  const animatedCurvesRef = useRef(
    curves.map((c, i) =>
      c.map(([x, y], j) => ({
        baseX: x,
        baseY: y,
        angle: Math.random() * Math.PI * 2 + i + j,
        radius: 0.15 + Math.random() * 0.1
      }))
    )
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0, 1); gl_PointSize = 1.0; }');
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, `
      precision mediump float;
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `);
    gl.compileShader(fs);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    const pos = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pos);

    // --- Buffer setup ---
    // Preallocate large enough buffers for all curves
    const N = 100; // points per curve
    const maxCurves = curves.length;
    const curveVertexCount = (N + 1) * maxCurves;
    const curveVertexBuffer = gl.createBuffer();
    const curveVertexArray = new Float32Array(curveVertexCount * 2);

    // For control points
    const maxControlPoints = maxCurves * 4;
    const controlPointBuffer = gl.createBuffer();
    const controlPointArray = new Float32Array(maxControlPoints * 2);

    function draw(animatedCurves) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.1, 0.1, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Fill curveVertexArray and controlPointArray
      let vtxOffset = 0;
      let ctrlOffset = 0;
      animatedCurves.forEach(controlPoints => {
        // Compute curve points
        function cubicBezier(t, p0, p1, p2, p3) {
          const mt = 1 - t;
          return [
            mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0],
            mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1]
          ];
        }
        const pts = controlPoints.map(pt => [pt.x, pt.y]);
        for (let i = 0; i <= N; ++i) {
          const t = i / N;
          const pt = cubicBezier(t, ...pts);
          curveVertexArray[vtxOffset++] = pt[0];
          curveVertexArray[vtxOffset++] = pt[1];
        }
        // Control points
        for (let i = 0; i < pts.length; ++i) {
          controlPointArray[ctrlOffset++] = pts[i][0];
          controlPointArray[ctrlOffset++] = pts[i][1];
        }
      });

      // Draw all curves in one call per curve
      let curveBase = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, curveVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, curveVertexArray, gl.DYNAMIC_DRAW);
      for (let i = 0; i < maxCurves; ++i) {
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, i * (N + 1), N + 1);
      }
      // Draw all control points in one call
      gl.bindBuffer(gl.ARRAY_BUFFER, controlPointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, controlPointArray, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, maxCurves * 4);
    }

    // Animation loop
    function animate() {
      const now = performance.now() / 1000;
      const animatedCurves = animatedCurvesRef.current.map(curve =>
        curve.map((pt, idx) => {
          const speed = 0.5 + idx * 0.2;
          const angle = pt.angle + now * speed;
          return {
            ...pt,
            x: pt.baseX + Math.cos(angle) * pt.radius,
            y: pt.baseY + Math.sin(angle) * pt.radius
          };
        })
      );
      draw(animatedCurves);
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [curves]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />;
};

export default MultiBezierWebGL;
