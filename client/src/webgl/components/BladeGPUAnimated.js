import React, { useRef, useEffect } from 'react';
import bladeConfig from '../../assets/bladeConfig.json';

// Quadratic Bezier helper
function quadBezier(t, p0, p1, p2) {
    const mt = 1 - t;
    return [
        mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0],
        mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1],
    ];
}

// Helper to generate the vertex shader source with injected sway formula
function getVertexShaderSource(swayFormula) {
    return `
attribute vec2 position;
attribute float bladeIndex;
attribute float bladeHeight;
attribute vec3 bladeColor;
uniform float time;
uniform float bladeCount;
uniform float spread;
uniform float spreadOffset;
uniform float phaseStep;
uniform float swaySpeed;
uniform float swayAmount;
varying vec3 vColor;
void main() {
    float xOffset = (bladeIndex / (bladeCount - 1.0)) * spread + spreadOffset;
    float phase = bladeIndex * phaseStep;
    float sway = ${swayFormula};
    float y = position.y * bladeHeight;
    gl_Position = vec4(position.x + xOffset + sway, y, 0.0, 1.0);
    vColor = bladeColor;
}
`;
}

const fragmentShaderSource = `
precision mediump float;
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(vColor, 1.0);
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

const BladeGPUAnimated = ({ bladeCount = 5 }) => {
    const canvasRef = useRef();

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const gl = canvas.getContext('webgl');
        if (!gl) return;

        // Interleave all blades and per-blade attributes, with per-blade randomized tip
        const baseLeft = bladeConfig.baseLeft;
        const baseRight = bladeConfig.baseRight;
        const leftCtrl = bladeConfig.leftCtrl;
        const rightCtrl = bladeConfig.rightCtrl;
        const N = bladeConfig.curveResolution;
        const allVerts = [];
        const allBladeIndices = [];
        const allBladeHeights = [];
        const allBladeColors = [];
        const allBladeRandoms = [];
        let vertsPerBlade = 0;
        for (let b = 0; b < bladeCount; ++b) {
            // Random height and color per blade
            const height = bladeConfig.heightMin + Math.random() * (bladeConfig.heightMax - bladeConfig.heightMin);
            const g = bladeConfig.colorGMin + Math.random() * (bladeConfig.colorGMax - bladeConfig.colorGMin);
            const r = bladeConfig.colorRMin + Math.random() * (bladeConfig.colorRMax - bladeConfig.colorRMin);
            const bCol = bladeConfig.colorBMin + Math.random() * (bladeConfig.colorBMax - bladeConfig.colorBMin);
            const bladeColor = [r, g, bCol];
            // Random value for blade sway (ensure unique per blade)
            const bladeRandom = Math.random();
            // Randomize tip per blade
            let tip = bladeConfig.tip;
            // If tip is an array and contains bladeRandom, evaluate it
            if (Array.isArray(tip) && typeof tip[1] === 'string' && tip[1].includes('bladeRandom')) {
                // Evaluate the y expression for tip
                // Example: [0.0, "0.1*bladeRandom"]
                // eslint-disable-next-line no-eval
                tip = [tip[0], eval(tip[1].replace(/bladeRandom/g, bladeRandom))];
            } else if (Array.isArray(tip) && typeof tip[1] === 'number') {
                tip = [tip[0], tip[1]];
            }
            // Build geometry for this blade
            const leftEdge = [];
            const rightEdge = [];
            for (let i = 0; i <= N; ++i) {
                const t = i / N;
                leftEdge.push(quadBezier(t, baseLeft, leftCtrl, tip));
                rightEdge.push(quadBezier(t, baseRight, rightCtrl, tip));
            }
            // Build interleaved triangle strip for one blade (for proper fill)
            const bladeVerts = [];
            for (let i = 0; i <= N; ++i) {
                bladeVerts.push(...leftEdge[i]);
                bladeVerts.push(...rightEdge[i]);
            }
            if (b === 0) vertsPerBlade = bladeVerts.length / 2;
            for (let i = 0; i < vertsPerBlade; ++i) {
                allVerts.push(bladeVerts[i * 2], bladeVerts[i * 2 + 1]);
                allBladeIndices.push(b);
                allBladeHeights.push(height);
                allBladeColors.push(...bladeColor);
                allBladeRandoms.push(bladeRandom);
            }
        }
        const vertArray = new Float32Array(allVerts);
        const bladeIndexArray = new Float32Array(allBladeIndices);
        const bladeHeightArray = new Float32Array(allBladeHeights);
        const bladeColorArray = new Float32Array(allBladeColors);
        const bladeRandomArray = new Float32Array(allBladeRandoms);

        // Compile shaders and link program
        const vertexShaderSource = `
attribute vec2 position;
attribute float bladeIndex;
attribute float bladeHeight;
attribute vec3 bladeColor;
attribute float bladeRandom;
uniform float time;
uniform float bladeCount;
uniform float spread;
uniform float spreadOffset;
uniform float phaseStep;
uniform float swaySpeed;
uniform float swayAmount;
varying vec3 vColor;
void main() {
    float xOffset = (bladeIndex / (bladeCount - 1.0)) * spread + spreadOffset;
    float phase = bladeIndex * phaseStep;
    float sway = ${bladeConfig.swayFormula};
    float y = -1.0 + position.y * bladeHeight * 2.0;
    gl_Position = vec4(position.x + xOffset + sway, y, 0.0, 1.0);
    vColor = bladeColor;
}
`;
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
        const bladeHeightLoc = gl.getAttribLocation(program, 'bladeHeight');
        const bladeColorLoc = gl.getAttribLocation(program, 'bladeColor');
        // Position
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        // Blade index
        const bladeIdxBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bladeIdxBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bladeIndexArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(bladeIdxLoc);
        gl.vertexAttribPointer(bladeIdxLoc, 1, gl.FLOAT, false, 0, 0);
        // Blade height
        const bladeHeightBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bladeHeightBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bladeHeightArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(bladeHeightLoc);
        gl.vertexAttribPointer(bladeHeightLoc, 1, gl.FLOAT, false, 0, 0);
        // Blade color
        const bladeColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bladeColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bladeColorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(bladeColorLoc);
        gl.vertexAttribPointer(bladeColorLoc, 3, gl.FLOAT, false, 0, 0);
        // Blade random attribute setup (must be after all other attributes, and not overwritten)
        const bladeRandLoc = gl.getAttribLocation(program, 'bladeRandom');
        const bladeRandBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bladeRandBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bladeRandomArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(bladeRandLoc);
        gl.vertexAttribPointer(bladeRandLoc, 1, gl.FLOAT, false, 0, 0);

        const timeLoc = gl.getUniformLocation(program, 'time');
        const bladeCountLoc = gl.getUniformLocation(program, 'bladeCount');
        const spreadLoc = gl.getUniformLocation(program, 'spread');
        const spreadOffsetLoc = gl.getUniformLocation(program, 'spreadOffset');
        const phaseStepLoc = gl.getUniformLocation(program, 'phaseStep');
        const swaySpeedLoc = gl.getUniformLocation(program, 'swaySpeed');
        const swayAmountLoc = gl.getUniformLocation(program, 'swayAmount');

        function render() {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.uniform1f(timeLoc, performance.now() * 0.001);
            gl.uniform1f(bladeCountLoc, bladeCount);
            gl.uniform1f(spreadLoc, bladeConfig.spread);
            gl.uniform1f(spreadOffsetLoc, bladeConfig.spreadOffset);
            gl.uniform1f(phaseStepLoc, bladeConfig.phaseStep);
            gl.uniform1f(swaySpeedLoc, bladeConfig.swaySpeed);
            gl.uniform1f(swayAmountLoc, bladeConfig.swayAmount);
            for (let b = 0; b < bladeCount; ++b) {
                const offset = b * vertsPerBlade;
                gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertsPerBlade);
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
