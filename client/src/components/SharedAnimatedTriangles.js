import React, { useRef, useEffect } from 'react';
import { sharedAnimatedTrianglesConfigs } from './SharedAnimatedTrianglesDefs';

// This component renders multiple animated triangles configurations, each with its own geometry, color,
// and animation logic. Each config is rendered in its own draw call, sharing the same canvas and context.

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
    // Store the latest animated positions for hit testing, one array per config
    let animatedPositionsArr = sharedAnimatedTrianglesConfigs.map(cfg => new Float32Array(cfg.vertices.length));

    let clicked = 0;
    // Program, VAO, buffer, and uniform locations per config
    let programs = [], vaos = [], vbos = [], ebos = [], timeLocs = [], uClickedLocs = [];

    sharedAnimatedTrianglesConfigs.forEach((cfg, cfgIdx) => {
      if (!cfg.visible) return;
      const vsSource = `#version 300 es\n      in vec2 position;\n      in float isTop;\n      in float triIndex;\n      uniform float time;\n      uniform float uClicked;\n      out float vY;\n      void main() {\n        vec2 pos = position;\n        ${cfg.positionExpr}\n        vY = pos.y;\n        gl_Position = vec4(pos, 0.0, 1.0);\n      }\n    `;
      const fsSource = `#version 300 es\n      precision mediump float;\n      in float vY;\n      uniform float uClicked;\n      out vec4 outColor;\n      void main() {\n        ${cfg.colorExpr}\n        if (uClicked > 0.5) {\n          outColor = mix(outColor, vec4(1.0, 0.0, 0.0, 1.0), 0.5);\n        }\n      }\n    `;
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
      const vertices = cfg.vertices;
      const indices = cfg.indices;
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
      programs.push(program);
      vaos.push(vao);
      vbos.push(vbo);
      ebos.push(ebo);
      timeLocs.push(timeLoc);
      uClickedLocs.push(uClickedLoc);
    });

    function handleClick(event) {
      const [x, y] = getNDCFromMouse(event);
      let found = false;
      sharedAnimatedTrianglesConfigs.forEach((cfg, cfgIdx) => {
        if (!cfg.visible) return;
        const idx = cfg.indices;
        const animatedPositions = animatedPositionsArr[cfgIdx];
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
      });
      if (!found) clicked = 0;
    }
    canvas.addEventListener('click', handleClick);

    function render(time) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      sharedAnimatedTrianglesConfigs.forEach((cfg, cfgIdx) => {
        if (!cfg.visible) return;
        const program = programs[cfgIdx];
        const vao = vaos[cfgIdx];
        const timeLoc = timeLocs[cfgIdx];
        const uClickedLoc = uClickedLocs[cfgIdx];
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniform1f(timeLoc, time);
        gl.uniform1f(uClickedLoc, clicked);
        gl.drawElements(gl.TRIANGLES, cfg.indices.length, gl.UNSIGNED_SHORT, 0);
        // Calculate animated positions for hit testing
        const verts = cfg.vertices;
        const animatedPositions = animatedPositionsArr[cfgIdx];
        for (let i = 0; i < verts.length; i += 4) {
          let px = verts[i];
          let py = verts[i+1];
          let triIndex = verts[i+3];
          let t = (Math.sin(time * 0.001 + triIndex * 1.5) + 1.0) * 0.5;
          px = px + t * py;
          animatedPositions[i] = px;
          animatedPositions[i+1] = py;
        }
      });
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
