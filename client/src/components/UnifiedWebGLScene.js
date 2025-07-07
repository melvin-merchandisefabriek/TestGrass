import React, { useRef, useEffect } from 'react';
import { useMemo } from 'react';
// import bladeConfig from './bladeConfig.json';

// Example: unified scene with grass and a Bezier shape
// You can expand this to include more scene elements as needed
const exampleBezierShape = [
  { type: 'quadratic', points: [[-0.5, 0.0], [-0.7, 0.5], [0.0, 0.7]] },
  { type: 'quadratic', points: [[0.0, 0.7], [0.7, 0.5], [0.5, 0.0]] },
  { type: 'quadratic', points: [[0.5, 0.0], [0.7, -0.5], [0.0, -0.7]] },
  { type: 'quadratic', points: [[0.0, -0.7], [-0.7, -0.5], [-0.5, 0.0]] },
];

function quadBezier(t, p0, p1, p2) {
    const mt = 1 - t;
    return [
        mt*mt*p0[0] + 2*mt*t*p1[0] + t*t*p2[0],
        mt*mt*p0[1] + 2*mt*t*p1[1] + t*t*p2[1]
    ];
}

function cubicBezier(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    return [
        mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0],
        mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1]
    ];
}

// Simple earclip triangulation for polygons
function earclip(points) {
    const n = points.length;
    if (n < 3) return [];
    const indices = Array.from({length: n}, (_, i) => i);
    const triangles = [];
    function area(a, b, c) {
        return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
    }
    function isEar(i0, i1, i2) {
        const a = points[i0], b = points[i1], c = points[i2];
        if (area(a, b, c) <= 0) return false;
        for (let j = 0; j < n; ++j) {
            if (j === i0 || j === i1 || j === i2) continue;
            const p = points[j];
            const s = ((a[1]-c[1])*(p[0]-c[0]) + (c[0]-a[0])*(p[1]-c[1])) /
                      ((a[1]-c[1])*(b[0]-c[0]) + (c[0]-a[0])*(b[1]-c[1]));
            const t = ((c[1]-b[1])*(p[0]-c[0]) + (b[0]-c[0])*(p[1]-c[1])) /
                      ((a[1]-c[1])*(b[0]-c[0]) + (c[0]-a[0])*(b[1]-c[1]));
            if (s > 0 && t > 0 && s + t < 1) return false;
        }
        return true;
    }
    let v = indices.slice();
    while (v.length > 3) {
        let earFound = false;
        for (let i = 0; i < v.length; ++i) {
            const i0 = v[(i+v.length-1)%v.length];
            const i1 = v[i];
            const i2 = v[(i+1)%v.length];
            if (isEar(i0, i1, i2)) {
                triangles.push([i0, i1, i2]);
                v.splice(i, 1);
                earFound = true;
                break;
            }
        }
        if (!earFound) break;
    }
    if (v.length === 3) triangles.push([v[0], v[1], v[2]]);
    return triangles;
}

// Deterministic seeded random for stable per-blade randomness
function seededRandom(seed) {
    // Mulberry32 PRNG
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function useStableRandoms(count) {
    // Each blade gets a deterministic random based on its index
    return useMemo(() => {
        return Array.from({length: count}, (_, i) => seededRandom(i));
    }, [count]);
}

function renderGrassBlades(gl, bladeCount, time, bladeRandoms) {
    // Parameters (could be config-driven)
    const baseHeight = 0.18;
    const baseWidth = 0.012;
    const minY = -1.0, maxY = -1.0 + baseHeight*2.0;
    const minX = -1.0, maxX = 1.0;
    const vertsPerBlade = 16;
    // Generate blade base positions and randoms
    let positions = [], randoms = [];
    for (let i = 0; i < bladeCount; ++i) {
        const x = minX + (maxX-minX) * (i + 0.5) / bladeCount;
        const y = minY;
        const r = bladeRandoms[i];
        // Sway is a base offset
        const sway = 0.12 * Math.sin(time*1.2 + r*6.28);
        // Build centerline
        let centerline = [];
        for (let j = 0; j < vertsPerBlade; ++j) {
            const t = j / (vertsPerBlade-1);
            let curve = 0.18 * Math.sin(t * Math.PI);
            if (j === vertsPerBlade-1) curve = 0; // force tip to be straight
            const cx = x + sway + curve;
            const cy = y + baseHeight * t;
            centerline.push([cx, cy]);
        }
        // Compute left/right vertices perpendicular to centerline direction
        for (let j = 0; j < vertsPerBlade; ++j) {
            const t = j / (vertsPerBlade-1);
            const width = baseWidth * (1 - t);
            // Direction: from previous to next point
            let dx, dy;
            if (j === 0) {
                dx = centerline[j+1][0] - centerline[j][0];
                dy = centerline[j+1][1] - centerline[j][1];
            } else if (j === vertsPerBlade-1) {
                dx = centerline[j][0] - centerline[j-1][0];
                dy = centerline[j][1] - centerline[j-1][1];
            } else {
                dx = centerline[j+1][0] - centerline[j-1][0];
                dy = centerline[j+1][1] - centerline[j-1][1];
            }
            // Perpendicular
            const len = Math.hypot(dx, dy) || 1.0;
            const px = -dy / len;
            const py = dx / len;
            // Left
            positions.push(centerline[j][0] - px * width, centerline[j][1] - py * width);
            randoms.push(r);
            // Right
            positions.push(centerline[j][0] + px * width, centerline[j][1] + py * width);
            randoms.push(r);
        }
    }
    const vertArray = new Float32Array(positions);
    const randArray = new Float32Array(randoms);
    // Shaders
    const vsSource = `
attribute vec2 position;
attribute float bladeRandom;
varying float vRand;
void main() {
    vRand = bladeRandom;
    gl_Position = vec4(position, 0.0, 1.0);
}`;
    const fsSource = `
precision mediump float;
varying float vRand;
void main() {
    gl_FragColor = vec4(0.2 + 0.3*vRand, 0.7, 0.2, 1.0);
}`;
    function createShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
    }
    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    // Attributes
    const posLoc = gl.getAttribLocation(prog, 'position');
    const randLoc = gl.getAttribLocation(prog, 'bladeRandom');
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    // Random attribute
    const randBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, randBuf);
    gl.bufferData(gl.ARRAY_BUFFER, randArray, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(randLoc);
    gl.vertexAttribPointer(randLoc, 1, gl.FLOAT, false, 0, 0);
    // Draw all blades as triangle strips
    for (let i = 0; i < bladeCount; ++i) {
        gl.drawArrays(gl.TRIANGLE_STRIP, i*vertsPerBlade*2, vertsPerBlade*2);
    }
}


const UnifiedWebGLScene = ({ grassCount = 30, bezierShape = exampleBezierShape }) => {
    const canvasRef = useRef();
    const bladeRandoms = useStableRandoms(grassCount);

    // --- Helper: Draw Bezier Shape ---
    function drawBezierShape(gl, bezierShape) {
        // ...existing code...
        let points = [];
        const resolution = 40;
        for (const seg of bezierShape) {
            for (let i = 0; i < resolution; ++i) {
                const t = i / resolution;
                if (seg.type === 'quadratic') {
                    points.push(quadBezier(t, ...seg.points));
                } else if (seg.type === 'cubic') {
                    points.push(cubicBezier(t, ...seg.points));
                }
            }
        }
        points.push(points[0]);
        const tris = earclip(points);
        const vertices = [];
        for (const tri of tris) {
            for (const idx of tri) {
                vertices.push(points[idx][0], points[idx][1]);
            }
        }
        const vertArray = new Float32Array(vertices);
        // WebGL setup for shape
        const vsSource = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;
        const fsSource = `
precision mediump float;
void main() {
    gl_FragColor = vec4(0.2, 0.8, 0.3, 1.0);
}`;
        function createShader(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
            return s;
        }
        const vs = createShader(gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const posLoc = gl.getAttribLocation(prog, 'position');
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/2);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteProgram(prog);
        gl.deleteBuffer(buf);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        let animationFrame;
        let running = true;

        function render() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const gl = canvas.getContext('webgl');
            if (!gl) return;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);


            // --- 1. Draw Bezier Shape (background) ---
            drawBezierShape(gl, bezierShape);

            // --- 2. Draw Grass Blades (foreground) ---
            const now = performance.now() * 0.001;
            renderGrassBlades(gl, grassCount, now, bladeRandoms);

            animationFrame = requestAnimationFrame(render);
        }
        animationFrame = requestAnimationFrame(render);
        return () => {
            running = false;
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [grassCount, bezierShape, bladeRandoms]);

    return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />;
};

export default UnifiedWebGLScene;
