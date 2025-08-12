import React, { useRef, useEffect } from 'react';

// Helper for cubic Bezier
function cubicBezier(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    return [
        mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0],
        mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1]
    ];
}

// Helper for quadratic Bezier
function quadBezier(t, p0, p1, p2) {
    const mt = 1 - t;
    return [
        mt*mt*p0[0] + 2*mt*t*p1[0] + t*t*p2[0],
        mt*mt*p0[1] + 2*mt*t*p1[1] + t*t*p2[1]
    ];
}

// Earclip triangulation (simple, assumes no self-intersections)
function earclip(points) {
    // points: [[x, y], ...] (must be CCW and closed)
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
            // Barycentric test
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
        if (!earFound) break; // Fallback: can't find ear
    }
    if (v.length === 3) triangles.push([v[0], v[1], v[2]]);
    return triangles;
}

/**
 * BezierShapeWebGL
 *
 * Props:
 *   shape: Array of segments, each segment is:
 *     { type: 'quadratic'|'cubic', points: [[x0,y0], [x1,y1], [x2,y2]] or [[x0,y0], [x1,y1], [x2,y2], [x3,y3]] }
 *   resolution: number of samples per segment
 */
const BezierShapeWebGL = ({ shape, resolution = 32 }) => {
    const canvasRef = useRef();

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const gl = canvas.getContext('webgl');
        if (!gl) return;

        // 1. Sample points along all segments
        let points = [];
        for (const seg of shape) {
            for (let i = 0; i < resolution; ++i) {
                const t = i / resolution;
                if (seg.type === 'quadratic') {
                    points.push(quadBezier(t, ...seg.points));
                } else if (seg.type === 'cubic') {
                    points.push(cubicBezier(t, ...seg.points));
                }
            }
        }
        // Close the shape
        points.push(points[0]);

        // 2. Triangulate
        const tris = earclip(points);
        const vertices = [];
        for (const tri of tris) {
            for (const idx of tri) {
                vertices.push(points[idx][0], points[idx][1]);
            }
        }
        const vertArray = new Float32Array(vertices);

        // 3. WebGL setup
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
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/2);
    }, [shape, resolution]);

    return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />;
};

export default BezierShapeWebGL;
