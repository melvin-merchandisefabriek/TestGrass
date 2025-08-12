// Simple, readable ear clipping triangulation for 2D polygons
// Input: points = [[x0, y0], [x1, y1], ..., [xn, yn]] (must be simple, counter-clockwise)
// Output: array of triangles, each as [i0, i1, i2] (indices into points)

function area2(a, b, c) {
  // Twice the signed area of triangle abc
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function isConvex(a, b, c) {
  return area2(a, b, c) > 0;
}

function pointInTriangle(p, a, b, c) {
  // Barycentric technique
  const area = area2(a, b, c);
  const area1 = area2(p, b, c);
  const area2_ = area2(a, p, c);
  const area3 = area2(a, b, p);
  const s = area1 / area;
  const t = area2_ / area;
  const u = area3 / area;
  return s >= 0 && t >= 0 && u >= 0 && s <= 1 && t <= 1 && u <= 1;
}

export function earclip(points) {
  const n = points.length;
  if (n < 3) return [];
  const indices = Array.from({ length: n }, (_, i) => i);
  const triangles = [];
  let guard = 0;
  while (indices.length > 3 && guard++ < 1000) {
    let earFound = false;
    for (let i = 0; i < indices.length; ++i) {
      const i0 = indices[(i + indices.length - 1) % indices.length];
      const i1 = indices[i];
      const i2 = indices[(i + 1) % indices.length];
      const a = points[i0], b = points[i1], c = points[i2];
      if (!isConvex(a, b, c)) continue;
      // Check if any other point is inside triangle abc
      let hasPointInside = false;
      for (let j = 0; j < indices.length; ++j) {
        if (j === (i + indices.length - 1) % indices.length || j === i || j === (i + 1) % indices.length) continue;
        const p = points[indices[j]];
        if (pointInTriangle(p, a, b, c)) {
          hasPointInside = true;
          break;
        }
      }
      if (hasPointInside) continue;
      // It's an ear
      triangles.push([i0, i1, i2]);
      indices.splice(i, 1);
      earFound = true;
      break;
    }
    if (!earFound) break; // No ear found, probably not simple polygon
  }
  // Final triangle
  if (indices.length === 3) {
    triangles.push([indices[0], indices[1], indices[2]]);
  }
  return triangles;
}
