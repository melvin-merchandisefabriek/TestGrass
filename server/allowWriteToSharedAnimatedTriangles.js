// allowWriteToSharedAnimatedTriangles.js
// Utility to validate and write POSTed config to SharedAnimatedTrianglesDefs.js

const fs = require('fs');
const path = require('path');

const TARGET_PATH = path.join(__dirname, '../client/src/components/SharedAnimatedTrianglesDefs.js');

function isValidConfig(obj) {
  // Basic validation: must have vertices, indices, colorExpr, positionExpr
  return obj &&
    Array.isArray(obj.vertices) &&
    Array.isArray(obj.indices) &&
    typeof obj.colorExpr === 'string' &&
    typeof obj.positionExpr === 'string';
}

function writeConfigToFile(config) {
  // Convert arrays to typed array code
  const verticesStr = `new Float32Array([\n  ${config.vertices.join(', ')}\n])`;
  const indicesStr = `new Uint16Array([\n  ${config.indices.join(', ')}\n])`;
  const fileContent = `// SharedAnimatedTrianglesDefs.js\n// Definitions for vertices, color expressions, and position expressions for SharedAnimatedTriangles\n\nexport const sharedAnimatedTrianglesConfig = {\n  visible: true,\n  vertices: ${verticesStr},\n  indices: ${indicesStr},\n  colorExpr: \`${config.colorExpr}\`,\n  positionExpr: \`${config.positionExpr}\`\n};\n`;
  fs.writeFileSync(TARGET_PATH, fileContent, 'utf8');
}

module.exports = { isValidConfig, writeConfigToFile };
