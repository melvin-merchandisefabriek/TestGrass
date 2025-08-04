import React, { useRef, useEffect } from 'react';
import { sharedAnimatedTrianglesConfigs } from './SharedAnimatedTrianglesDefs';

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

    // Get visible configs
    const visibleConfigs = sharedAnimatedTrianglesConfigs.filter(cfg => cfg.visible);

    // Vertex shader: all per-config data is in attributes
    const vsSource = `#version 300 es
      in vec2 position;
      in float isTop;
      in float triIndex;
      in float configId;
      in float animSpeed;
      in float baseX;
      in float width;
      in vec4 colorA;
      in vec4 colorB;
      uniform float time;
      out float vY;
      out vec4 vColorA;
      out vec4 vColorB;
      void main() {
        vec2 pos = position;
        if (isTop > 0.5) {
          float t = (sin(time * 0.001 + triIndex * animSpeed) + 1.0) * 0.5;
          t = t;
          pos.x = baseX + t * width * 2.0 - width;
        }
        vY = pos.y;
        vColorA = colorA;
        vColorB = colorB;
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;

    // Fragment shader: color by y position, blend between colorA and colorB
    const fsSource = `#version 300 es
      precision mediump float;
      in float vY;
      in vec4 vColorA;
      in vec4 vColorB;
      out vec4 outColor;
      void main() {
        float t = (vY + 0.8) / 1.6;
        outColor = mix(vColorA, vColorB, t);
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

    // Batch all visible configs into one vertex/index buffer
    let totalVertices = 0;
    let totalIndices = 0;
    let stride = 18; // floats per vertex
    visibleConfigs.forEach(cfg => {
      totalVertices += cfg.vertices.length / stride;
      totalIndices += cfg.indices.length;
    });
    const vertices = new Float32Array(totalVertices * stride);
    const indices = new Uint16Array(totalIndices);
    let vOffset = 0;
    let iOffset = 0;
    let baseVertex = 0;
    visibleConfigs.forEach(cfg => {
      vertices.set(cfg.vertices, vOffset * stride);
      for (let i = 0; i < cfg.indices.length; ++i) {
        indices[iOffset + i] = cfg.indices[i] + baseVertex;
      }
      vOffset += cfg.vertices.length / stride;
      iOffset += cfg.indices.length;
      baseVertex += cfg.vertices.length / stride;
    });
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    // Attribute pointers
    // Set up attribute pointers for all per-vertex data
    // [x, y, isTop, triIndex, configId, animSpeed, baseX, width, colorA(rgba), colorB(rgba)]
    const bytesPerFloat = 4;
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride * bytesPerFloat, 0);
    const isTopLoc = gl.getAttribLocation(program, 'isTop');
    gl.enableVertexAttribArray(isTopLoc);
    gl.vertexAttribPointer(isTopLoc, 1, gl.FLOAT, false, stride * bytesPerFloat, 2 * bytesPerFloat);
    const triIndexLoc = gl.getAttribLocation(program, 'triIndex');
    gl.enableVertexAttribArray(triIndexLoc);
    gl.vertexAttribPointer(triIndexLoc, 1, gl.FLOAT, false, stride * bytesPerFloat, 3 * bytesPerFloat);
    const configIdLoc = gl.getAttribLocation(program, 'configId');
    gl.enableVertexAttribArray(configIdLoc);
    gl.vertexAttribPointer(configIdLoc, 1, gl.FLOAT, false, stride * bytesPerFloat, 4 * bytesPerFloat);
    const animSpeedLoc = gl.getAttribLocation(program, 'animSpeed');
    gl.enableVertexAttribArray(animSpeedLoc);
    gl.vertexAttribPointer(animSpeedLoc, 1, gl.FLOAT, false, stride * bytesPerFloat, 5 * bytesPerFloat);
    const baseXLoc = gl.getAttribLocation(program, 'baseX');
    gl.enableVertexAttribArray(baseXLoc);
    gl.vertexAttribPointer(baseXLoc, 1, gl.FLOAT, false, stride * bytesPerFloat, 6 * bytesPerFloat);
    const widthLoc = gl.getAttribLocation(program, 'width');
    gl.enableVertexAttribArray(widthLoc);
    gl.vertexAttribPointer(widthLoc, 1, gl.FLOAT, false, stride * bytesPerFloat, 7 * bytesPerFloat);
    const colorALoc = gl.getAttribLocation(program, 'colorA');
    gl.enableVertexAttribArray(colorALoc);
    gl.vertexAttribPointer(colorALoc, 4, gl.FLOAT, false, stride * bytesPerFloat, 8 * bytesPerFloat);
    const colorBLoc = gl.getAttribLocation(program, 'colorB');
    gl.enableVertexAttribArray(colorBLoc);
    gl.vertexAttribPointer(colorBLoc, 4, gl.FLOAT, false, stride * bytesPerFloat, 12 * bytesPerFloat);
    const timeLoc = gl.getUniformLocation(program, 'time');

    function render(time) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(timeLoc, time);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(render);
    }
    render(0);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block', margin: 0, padding: 0 }} />;
};

export default SharedAnimatedTriangles;
