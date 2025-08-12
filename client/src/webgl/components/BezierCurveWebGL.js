import React, { useRef, useEffect } from 'react';

const BezierCurveWebGL = ({ controlPoints, height = '100vh' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Set canvas height in pixels based on style height
    const pxHeight = canvas.parentElement
      ? canvas.parentElement.clientHeight
      : window.innerHeight / 3;
    canvas.width = window.innerWidth;
    canvas.height = pxHeight;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0, 1); gl_PointSize = 50.0; }');
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

    // Compute curve points
    function cubicBezier(t, p0, p1, p2, p3) {
      const mt = 1 - t;
      return [
        mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0],
        mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1]
      ];
    }
    const curvePoints = [];
    const N = 100;
    for (let i = 0; i <= N; ++i) {
      const t = i / N;
      const pt = cubicBezier(t, ...controlPoints);
      curvePoints.push(pt[0], pt[1]);
    }

    // Draw curve
    const curveBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, curveBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(curvePoints), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINE_STRIP, 0, curvePoints.length / 2);

    // Draw control points
    const pointBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(controlPoints.flat()), gl.STATIC_DRAW);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, controlPoints.length);

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = pxHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindBuffer(gl.ARRAY_BUFFER, curveBuf);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, curvePoints.length / 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, controlPoints.length);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [controlPoints, height]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />;
};

export default BezierCurveWebGL;
