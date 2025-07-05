import React, { useRef, useEffect } from 'react';

// Quadratic Bezier helper
function quadBezier(t, p0, p1, p2) {
    const mt = 1 - t;
    return [
        mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0],
        mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1],
    ];
}

const vertexShaderSource = `
attribute vec2 position;
attribute float bladeIndex;
uniform float time;
uniform float bladeCount;
void main() {
    // Spread blades horizontally and animate phase
    float xOffset = (bladeIndex / (bladeCount - 1.0)) * 1.6 - 0.8; // spread in [-0.8, 0.8]
    float phase = bladeIndex * 0.7;
    float sway = sin(time * 2.0 + position.y * 2.0 + phase) * 0.2 * position.y;
    gl_Position = vec4(position.x + xOffset + sway, position.y, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;
void main() {
    gl_FragColor = vec4(0.2, 0.8, 0.3, 1.0); // green
}
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

const BladeGPUAnimated = ({ bladeCount = 5000 }) => {
    const canvasRef = useRef();

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const gl = canvas.getContext('webgl');
        if (!gl) return;

        // Geometry for one blade (triangle with two curved sides)
        const baseLeft = [-0.05, 0.0];
        const baseRight = [0.05, 0.0];
        const tip = [0.0, 0.5];
        const leftCtrl = [-0.09, 0.3];
        const rightCtrl = [0.09, 0.3];
        const N = 24;
        const leftEdge = [];
        const rightEdge = [];
        for (let i = 0; i <= N; ++i) {
            const t = i / N;
            leftEdge.push(quadBezier(t, baseLeft, leftCtrl, tip));
            rightEdge.push(quadBezier(t, baseRight, rightCtrl, tip));
        }
        // Build triangle fan for one blade
        const bladeVerts = [];
        for (let i = 0; i < N; ++i) bladeVerts.push(...leftEdge[i]);
        bladeVerts.push(...tip);
        for (let i = N - 1; i > 0; --i) bladeVerts.push(...rightEdge[i]);
        bladeVerts.push(...baseRight);
        bladeVerts.push(...baseLeft);
        const vertsPerBlade = bladeVerts.length / 2;

        // Interleave all blades
        const allVerts = [];
        const allBladeIndices = [];
        for (let b = 0; b < bladeCount; ++b) {
            for (let i = 0; i < vertsPerBlade; ++i) {
                allVerts.push(bladeVerts[i * 2], bladeVerts[i * 2 + 1]);
                allBladeIndices.push(b);
            }
        }
        const vertArray = new Float32Array(allVerts);
        const bladeIndexArray = new Float32Array(allBladeIndices);

        // Compile shaders and link program
        const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Set up attributes
        const posLoc = gl.getAttribLocation(program, 'position');
        const bladeIdxLoc = gl.getAttribLocation(program, 'bladeIndex');
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Blade index attribute
        const bladeIdxBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bladeIdxBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bladeIndexArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(bladeIdxLoc);
        gl.vertexAttribPointer(bladeIdxLoc, 1, gl.FLOAT, false, 0, 0);

        const timeLoc = gl.getUniformLocation(program, 'time');
        const bladeCountLoc = gl.getUniformLocation(program, 'bladeCount');

        function render() {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.uniform1f(timeLoc, performance.now() * 0.001);
            gl.uniform1f(bladeCountLoc, bladeCount);
            for (let b = 0; b < bladeCount; ++b) {
                const offset = b * vertsPerBlade;
                gl.drawArrays(gl.TRIANGLE_FAN, offset, vertsPerBlade);
            }
            requestAnimationFrame(render);
        }
        render();

        // Resize handler
        function handleResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [bladeCount]);

    return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />;
};

export default BladeGPUAnimated;
