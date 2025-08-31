// allowWriteToSharedAnimatedTriangles.js
// Utility to validate and write POSTed config to SharedAnimatedTrianglesDefs.js

const fs = require('fs');
const path = require('path');

// In the runtime container we only ship the built client, not client/src.
// So persist dynamic triangle config as JSON under server/data where a volume is mounted.
const DATA_DIR = path.join(__dirname, 'data');
const TARGET_PATH = path.join(DATA_DIR, 'sharedAnimatedTrianglesConfig.json');

function isValidConfig(obj) {
  // Basic validation: must have vertices, indices, colorExpr, positionExpr
  return obj &&
    Array.isArray(obj.vertices) &&
    Array.isArray(obj.indices) &&
    typeof obj.colorExpr === 'string' &&
    typeof obj.positionExpr === 'string';
}

function writeConfigToFile(config) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const payload = {
    visible: true,
    vertices: config.vertices,
    indices: config.indices,
    colorExpr: config.colorExpr,
    positionExpr: config.positionExpr,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(TARGET_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

// Expose the path for potential future GET endpoint
module.exports = { isValidConfig, writeConfigToFile, TARGET_PATH };
