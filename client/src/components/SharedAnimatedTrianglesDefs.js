// SharedAnimatedTrianglesDefs.js
// Definitions for vertices, color expressions, and position expressions for SharedAnimatedTriangles

//vec4 for color can be used like this:
//vec4(R, G, B, A)

// Export a single config object containing all arrays and expressions
export const sharedAnimatedTrianglesConfig = {
  visible: true, // Set to false to hide this config's rendering
  vertices: new Float32Array([
    // x,    y,    isTop, triIndex
     0.0,  0.8,   1,     0, // v0: top1
    -0.8, -0.0,   0,     1, // v1: left
     0.8, -0.0,   0,     1, // v2: right
     0.0, -0.8,   1,     1, // v3: bottom1
     0.8, -0.8,   0,     1, // v4: bottom2
  ]),
  indices: new Uint16Array([
    0, 1, 2, // triangle 1
    3, 1, 2,  // triangle 2
    4, 2, 3 // triangle 3
  ]),
  colorExpr: `
    // Color by y position: blue at bottom, orange at top
    float t = (vY + 0.8) / 1.6; // map y from [-0.8,0.8] to [0,1]
    outColor = mix(vec4(0.0, 0.05, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), t);
  `,
  positionExpr: `
    float t = (sin(time * 0.001 + triIndex * 1.5) + 1.0) * 0.5;
    // Move x by an amount proportional to y: top moves most, bottom least
    pos.x += t * pos.y;
  `
};
