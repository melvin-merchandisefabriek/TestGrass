const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { isValidConfig, writeConfigToFile, TARGET_PATH } = require('./allowWriteToSharedAnimatedTriangles');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory cache (optional small optimization)
let shapesCache = null;
const SHAPES_LIST_FILE = path.join(__dirname, 'data', 'shapesList.json');
const SHAPES_DIR = path.join(__dirname, 'data');

function loadShapesList() {
  if (shapesCache) return shapesCache;
  try {
    const raw = fs.readFileSync(SHAPES_LIST_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.shapes || !Array.isArray(parsed.shapes)) {
      shapesCache = { shapes: [] };
    } else {
      shapesCache = parsed;
    }
  } catch (e) {
    shapesCache = { shapes: [] };
  }
  return shapesCache;
}

function saveShapesList(list) {
  shapesCache = list; // update cache
  fs.writeFileSync(SHAPES_LIST_FILE, JSON.stringify(list, null, 2));
}

function isValidId(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

function isSafeFilename(name) {
  return /^[a-zA-Z0-9._-]+\.json$/.test(name) && !name.includes('..');
}

// API routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World from the server!' });
});

// POST config for SharedAnimatedTriangles (write to source file for rebuild/dev usage)
app.post('/api/shared-animated-triangles-config', (req, res) => {
  try {
    const cfg = req.body;
    if (!isValidConfig(cfg)) {
      return res.status(400).json({ error: 'Invalid config structure' });
    }
    writeConfigToFile(cfg);
    return res.json({ status: 'ok' });
  } catch (e) {
    console.error('Failed to write shared animated triangles config', e);
    return res.status(500).json({ error: 'Failed to persist config' });
  }
});

app.get('/api/shared-animated-triangles-config', (req, res) => {
  try {
    if (!fs.existsSync(TARGET_PATH)) {
      return res.status(404).json({ error: 'No config found' });
    }
    const raw = fs.readFileSync(TARGET_PATH, 'utf8');
    return res.type('application/json').send(raw);
  } catch (e) {
    console.error('Failed to read shared animated triangles config', e);
    return res.status(500).json({ error: 'Failed to read config' });
  }
});

app.get('/api/shapes', (req, res) => {
  const list = loadShapesList();
  res.json(list);
});

app.post('/api/shapes', (req, res) => {
  const { mode, id, path: shapePath, filename, shapeJson } = req.body || {};

  if (!id || !isValidId(id)) {
    return res.status(400).json({ error: 'Invalid or missing id' });
  }

  const list = loadShapesList();
  if (list.shapes.some(s => s.id === id)) {
    return res.status(400).json({ error: 'Id already exists' });
  }

  if (mode === 'reference') {
    if (!shapePath || typeof shapePath !== 'string' || !shapePath.endsWith('.json')) {
      return res.status(400).json({ error: 'Invalid shapePath' });
    }
    const entry = { id, path: shapePath };
    list.shapes.push(entry);
    saveShapesList(list);
    return res.json(entry);
  } else if (mode === 'new') {
    if (!filename || !isSafeFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    if (typeof shapeJson !== 'object' || Array.isArray(shapeJson) || !shapeJson) {
      return res.status(400).json({ error: 'shapeJson must be an object' });
    }
    try {
      if (!fs.existsSync(SHAPES_DIR)) fs.mkdirSync(SHAPES_DIR, { recursive: true });
      const targetFile = path.join(SHAPES_DIR, filename);
      if (fs.existsSync(targetFile)) {
        return res.status(400).json({ error: 'File already exists' });
      }
      fs.writeFileSync(targetFile, JSON.stringify(shapeJson, null, 2));
      const entry = { id, path: `/data/${filename}` };
      list.shapes.push(entry);
      saveShapesList(list);
      return res.json(entry);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to write file' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid mode. Use "reference" or "new"' });
  }
});

app.delete('/api/shapes/:id', (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const list = loadShapesList();
  const idx = list.shapes.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = list.shapes.splice(idx, 1);
  saveShapesList(list);
  res.json({ removed });
});

// Serve static assets
// Set static folder
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
