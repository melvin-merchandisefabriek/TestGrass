// SharedAnimatedTrianglesDefs.js
// Definitions for vertices, color expressions, and position expressions for SharedAnimatedTriangles

// Export an array of config objects for batching
// Generate 1000 random configs
function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1.0];
}

export const sharedAnimatedTrianglesConfigs = Array.from({ length: 1 }, (_, i) => {
  // Randomize width/height first
  const width = 0.1 + Math.random() * 0.1;
  const height = 0.1 + Math.random() * 0.1;
  // Compute safe range for baseX/baseY so triangle never leaves [-0.98, 0.98]
  const baseX = (Math.random() * (1.96 - 2 * width)) - (0.98 - width);
  const baseY = (Math.random() * (1.96 - 2 * height)) - (0.98 - height);
  const animSpeed = 1 + Math.random() * 3;
  const colorA = randomColor();
  const colorB = randomColor();
  // Per-vertex attributes: [x, y, isTop, triIndex, configId, animSpeed, baseX, width, colorA(rgba), colorB(rgba)]
  function v(x, y, isTop, triIndex) {
    return [x, y, isTop, triIndex, i, animSpeed, baseX, width, ...colorA, ...colorB];
  }
  return {
    configId: i,
    visible: true,
    // 18 floats per vertex
    vertices: new Float32Array([
      ...v(baseX, baseY + height, 1, 0), // v0: top1
      ...v(baseX - width, baseY, 0, 1), // v1: left
      ...v(baseX + width, baseY, 0, 1), // v2: right
      ...v(baseX, baseY - height, 1, 1), // v3: top2
    ]),
    indices: new Uint16Array([
      0, 1, 2,
      3, 1, 2
    ]),
    vertexStride: 18 // floats per vertex
  };
});
/*vertices: new Float32Array([
      ...v(baseX, baseY + height, 1, 0), // v0: top1
      ...v(baseX - width, baseY, 0, 1), // v1: left
      ...v(baseX + width, baseY, 0, 1), // v2: right
      ...v(baseX, baseY - height, 1, 1), // v3: top2
    ]),*/