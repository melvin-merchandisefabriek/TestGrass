import React, { useRef, useEffect } from 'react';
import { sharedAnimatedTrianglesConfig } from './SharedAnimatedTrianglesDefs';

// This component renders two animated triangles that share vertices in a single WebGL2 draw call.
// The triangles share a base (bottom edge), so the vertex array is:
//   v0 (top1), v1 (left), v2 (right), v3 (top2)
// Triangle 1: v0, v1, v2
// Triangle 2: v3, v1, v2

const SharedAnimatedTriangles = () => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    // --- Click detection ---
    function getNDCFromMouse(event) {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);
      return [x, y];
    }
    // Barycentric point-in-triangle test
    function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
      const v0x = cx - ax, v0y = cy - ay;
      const v1x = bx - ax, v1y = by - ay;
      const v2x = px - ax, v2y = py - ay;
      const dot00 = v0x * v0x + v0y * v0y;
      const dot01 = v0x * v1x + v0y * v1y;
      const dot02 = v0x * v2x + v0y * v2y;
      const dot11 = v1x * v1x + v1y * v1y;
      const dot12 = v1x * v2x + v1y * v2y;
      const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
      const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
      const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
      return u >= 0 && v >= 0 && (u + v < 1);
    }
    // Store the latest animated positions for hit testing
    let animatedPositions = new Float32Array(sharedAnimatedTrianglesConfig.vertices.length);

    function handleClick(event) {
      const [x, y] = getNDCFromMouse(event);
      const idx = sharedAnimatedTrianglesConfig.indices;
      let found = false;
      for (let i = 0; i < idx.length; i += 3) {
        const ia = idx[i] * 4, ib = idx[i+1] * 4, ic = idx[i+2] * 4;
        const ax = animatedPositions[ia], ay = animatedPositions[ia+1];
        const bx = animatedPositions[ib], by = animatedPositions[ib+1];
        const cx = animatedPositions[ic], cy = animatedPositions[ic+1];
        if (pointInTriangle(x, y, ax, ay, bx, by, cx, cy)) {
          clicked = 1;
          found = true;
          break;
        }
      }
      if (!found) clicked = 0;
    }
    canvas.addEventListener('click', handleClick);

    // Vertex shader: animate both top vertices independently using their index
    const vsSource = `#version 300 es
      in vec2 position;
      in float isTop;
      in float triIndex;
      uniform float time;
      uniform float uClicked;
      out float vY;
      void main() {
        vec2 pos = position;
        ${sharedAnimatedTrianglesConfig.positionExpr}
        vY = pos.y;
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;
    const fsSource = `#version 300 es
      precision mediump float;
      in float vY;
      uniform float uClicked;
      out vec4 outColor;
      void main() {
        ${sharedAnimatedTrianglesConfig.colorExpr}
        if (uClicked > 0.5) {
          outColor = mix(outColor, vec4(1.0, 0.0, 0.0, 1.0), 0.5);
        }
      }
    `;
    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }
    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Import vertex and index data
    const vertices = sharedAnimatedTrianglesConfig.vertices;
    const indices = sharedAnimatedTrianglesConfig.indices;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    // Attribute pointers
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    const isTopLoc = gl.getAttribLocation(program, 'isTop');
    gl.enableVertexAttribArray(isTopLoc);
    gl.vertexAttribPointer(isTopLoc, 1, gl.FLOAT, false, 16, 8);
    const triIndexLoc = gl.getAttribLocation(program, 'triIndex');
    gl.enableVertexAttribArray(triIndexLoc);
    gl.vertexAttribPointer(triIndexLoc, 1, gl.FLOAT, false, 16, 12);
    const timeLoc = gl.getUniformLocation(program, 'time');
    const uClickedLoc = gl.getUniformLocation(program, 'uClicked');
    let clicked = 0;

    function render(time) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(timeLoc, time);
      gl.uniform1f(uClickedLoc, clicked);
      gl.drawElements(gl.TRIANGLES, 9, gl.UNSIGNED_SHORT, 0);

      // Calculate animated positions for hit testing
      const verts = sharedAnimatedTrianglesConfig.vertices;
      for (let i = 0; i < verts.length; i += 4) {
        // Copy original
        let px = verts[i];
        let py = verts[i+1];
        let triIndex = verts[i+3];
        // Apply the same animation as in the shader
        let t = (Math.sin(time * 0.001 + triIndex * 1.5) + 1.0) * 0.5;
        px = px + t * py;
        animatedPositions[i] = px;
        animatedPositions[i+1] = py;
      }

      requestAnimationFrame(render);
    }
    render(0);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: 'block', margin: 0, padding: 0 }} />;
};

export default SharedAnimatedTriangles;
