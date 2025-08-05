import React, { useRef, useEffect } from 'react';

const AnimatedWebGLTriangle = () => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 400;
    canvas.height = 400;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    // Vertex shader: animate top vertex x in the shader using time uniform (WebGL2/GLSL 3.00)
    const vsSource = `#version 300 es
      in vec2 position;
      uniform float time;
      void main() {
        vec2 pos = position;
        if (pos.y > 0.0) {
          float t = (sin(time * 0.001) + 1.0) * 0.5;
          pos.x = -0.8 + t * 1.6;
        }
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;
    // Fragment shader (WebGL2/GLSL 3.00)
    const fsSource = `#version 300 es
      precision mediump float;
      out vec4 outColor;
      void main() {
        outColor = vec4(0.2, 0.7, 1.0, 1.0);
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

    // Triangle vertices (NDC)
    const vertices = new Float32Array([
      0.0,  0.8,   // top vertex (will animate x)
     -0.8, -0.8,   // left
      0.8, -0.8    // right
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    // For WebGL2, use getAttribLocation and enableVertexAttribArray as before, but bind to 'in' variable
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'time');

    function render(time) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(timeLoc, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(render);
    }
    render(0);
  }, []);

  return <canvas ref={canvasRef} style={{ width: 400, height: 400, display: 'block', margin: '2rem auto' }} />;
};

export default AnimatedWebGLTriangle;
