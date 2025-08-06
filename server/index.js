const express = require('express');
const cors = require('cors');
const path = require('path');

const { isValidConfig, writeConfigToFile } = require('./allowWriteToSharedAnimatedTriangles');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World from the server!' });
});

// POST route to update SharedAnimatedTrianglesDefs.js
app.post('/api/shared-animated-triangles-config', (req, res) => {
  const config = req.body;
  if (!isValidConfig(config)) {
    return res.status(400).json({ error: 'Invalid config format.' });
  }
  try {
    writeConfigToFile(config);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write file.', details: err.message });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
