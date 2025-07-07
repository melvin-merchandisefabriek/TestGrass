# Detailed Explanation: How Shapes Are Built and Sent to WebGL

This document explains, in great detail, how the grass blade shapes are constructed in JavaScript/React and how their geometry and attributes are sent to WebGL for rendering and animation. It covers both the CPU-side (JS) and GPU-side (WebGL/shader) processes.

---

## 1. **Configuration: bladeConfig.json**

All parameters for the blade geometry, color, and animation are defined in `bladeConfig.json`. This includes:
- Control points for the blade's base, tip, and curves
- Color ranges
- Animation formulas (as strings)
- Spread and randomness settings

Example:
```json
{
  "baseLeft": [-0.005, 0.0],
  "baseRight": [0.005, 0.0],
  "tip": [0.0, "0.1*(0.2*bladeRandom+0.8)"],
  "leftCtrl": [-0.0025, 0.05],
  "rightCtrl": [0.0025, 0.05],
  ...
}
```

---

## 2. **Blade Geometry Construction (JavaScript/React)**

### a. **Randomization Per Blade**
- For each blade, a random value (`bladeRandom`) is generated using `Math.random()`.
- This value is used for per-blade variation in geometry (e.g., tip height), color, and animation.

### b. **Control Points**
- The base, tip, and control points for each blade are read from the config.
- If a control point (like `tip`) is an array with a string (e.g., `"0.1*bladeRandom"`), it is evaluated using the current blade's `bladeRandom`.
- This allows each blade to have a unique tip position.

### c. **Bezier Curve Sampling**
- The blade outline is defined by two quadratic Bezier curves: one for the left edge, one for the right.
- For each edge, the code samples `N` points along the curve using the `quadBezier` helper:
  ```js
  function quadBezier(t, p0, p1, p2) {
      const mt = 1 - t;
      return [
          mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0],
          mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1],
      ];
  }
  ```
- The left and right edge points are paired to form a triangle strip (for filled geometry).

### d. **Attribute Arrays**
- For each blade, the following arrays are built:
  - `allVerts`: All vertex positions (x, y) for all blades
  - `allBladeIndices`: The blade index for each vertex
  - `allBladeHeights`: The height for each vertex
  - `allBladeColors`: The color (r, g, b) for each vertex
  - `allBladeRandoms`: The random value for each vertex
- These arrays are flattened and converted to `Float32Array` for WebGL.

---

## 2b. **Shape Math: Bezier Curves and Triangle Strips**

### **What is a Quadratic Bezier Curve?**
A quadratic Bezier curve is a smooth curve defined by three points: a start point (P0), a control point (P1), and an end point (P2). The curve is calculated as:

```
B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2,   where t ∈ [0, 1]
```
- At t=0, the curve is at P0.
- At t=1, the curve is at P2.
- The control point P1 "pulls" the curve, shaping its bend.

### **How is the Blade Outline Built?**
- Each blade is defined by two quadratic Bezier curves:
  - The left edge: from `baseLeft` to `tip` with `leftCtrl` as the control point.
  - The right edge: from `baseRight` to `tip` with `rightCtrl` as the control point.
- For each edge, the code samples N points along the curve (using the `quadBezier` function), resulting in two lists of points: one for the left edge, one for the right.

### **What is a Triangle Strip?**
A triangle strip is a way to efficiently represent a connected series of triangles in graphics. Instead of specifying every triangle's three vertices separately, you provide a sequence of points, and each new point after the first two forms a new triangle with the previous two points.

- For a sequence of points [A, B, C, D, E], the triangles are:
  - Triangle 1: A, B, C
  - Triangle 2: B, C, D
  - Triangle 3: C, D, E
- This reduces the amount of data sent to the GPU and ensures the triangles are connected (no gaps).

### **How is the Blade Shape Filled?**
- The sampled points from the left and right edges are paired up: for each t, you have a left point and a right point.
- These pairs are interleaved into a single array: [left0, right0, left1, right1, left2, right2, ...].
- This array is sent to WebGL as a triangle strip.
- The GPU then fills the area between the left and right edges with triangles, creating a solid, filled blade shape.

### **Why Use Triangle Strips?**
- They are memory-efficient: fewer vertices need to be sent to the GPU.
- They guarantee that the triangles are connected, so the blade is filled without gaps or overlaps.
- They are fast for the GPU to process.

### **Visual Example**
Imagine the left and right edges as two lines running from the base to the tip of the blade. The triangle strip "zips" these two lines together, filling in the space between them with triangles, resulting in a smooth, filled blade.

---

## 3. **Sending Data to WebGL**

### a. **Buffer Setup**
- For each attribute (position, index, height, color, random), a WebGL buffer is created and filled with the corresponding data.
- Each buffer is bound and linked to a shader attribute using `gl.vertexAttribPointer`.

### b. **Shader Program**
- The vertex and fragment shaders are compiled and linked into a program.
- The vertex shader receives all per-vertex attributes and uniforms (time, spread, etc.).

---

## 4. **Vertex Shader (GPU Side)**

### a. **Inputs**
- `attribute vec2 position;` — Vertex position (from geometry)
- `attribute float bladeIndex;` — Blade index
- `attribute float bladeHeight;` — Blade height
- `attribute vec3 bladeColor;` — Blade color
- `attribute float bladeRandom;` — Per-blade random value
- Uniforms: time, spread, phaseStep, etc.

### b. **Position Calculation**
- The x-position is offset based on blade index and spread:
  ```glsl
  float xOffset = (bladeIndex / (bladeCount - 1.0)) * spread + spreadOffset;
  ```
- The y-position is scaled and mapped so the base is at the bottom of the screen:
  ```glsl
  float y = -1.0 + position.y * bladeHeight * 2.0;
  ```
- Sway is calculated using the config-driven formula, which can use `bladeRandom`, `phase`, and other variables.
- The final position is:
  ```glsl
  gl_Position = vec4(position.x + xOffset + sway, y, 0.0, 1.0);
  ```

### c. **Color Passing**
- The color is passed to the fragment shader via a varying.

---

## 5. **Fragment Shader (GPU Side)**
- Receives the color from the vertex shader and outputs it as the pixel color.

---

## 6. **Animation Loop**
- The `render` function updates the `time` uniform and redraws all blades every frame using `requestAnimationFrame`.
- This allows for real-time animation of the blades based on the sway formula.

---

## 7. **Summary of Data Flow**
1. **Config** defines geometry, color, and animation formulas.
2. **JS/React** builds per-blade geometry and attributes, evaluating any random-dependent expressions.
3. **Buffers** are created and filled with all vertex and attribute data.
4. **WebGL** receives the data, and the vertex shader computes the final position and animation for each vertex.
5. **Fragment shader** colors each pixel.
6. **Animation** is achieved by updating the `time` uniform and redrawing every frame.

---

## 8. **Customization**
- You can change the shape, color, and animation of the blades by editing `bladeConfig.json`.
- The system supports per-blade randomness and config-driven math for maximum flexibility.

---

If you want even more detail on any step, or code samples for a specific part, just ask!
