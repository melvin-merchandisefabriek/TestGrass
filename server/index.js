const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure the shapes directory exists
const shapesDir = path.join(__dirname, '..', 'grass-preview', 'public', 'shapes');
if (!fs.existsSync(shapesDir)) {
  fs.mkdirSync(shapesDir, { recursive: true });
}

// API endpoint to save shapes
app.post('/api/shapes', (req, res) => {
  try {
    const { name, paths, svgData } = req.body;
    
    if (!name || !paths || !svgData) {
      return res.status(400).json({ error: 'Missing required fields: name, paths, svgData' });
    }
    
    const filename = `${name.replace(/[^a-z0-9]/gi, '_')}.json`;
    const filePath = path.join(shapesDir, filename);
    
    // Save the shape data
    const shapeData = {
      name,
      paths,
      svgData,
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(shapeData, null, 2));
    
    res.status(201).json({ 
      success: true, 
      message: `Shape saved as ${filename}`,
      filePath: `/shapes/${filename}`
    });
  } catch (error) {
    console.error('Error saving shape:', error);
    res.status(500).json({ error: 'Failed to save shape', details: error.message });
  }
});

// API endpoint to get all shapes
app.get('/api/shapes', (req, res) => {
  try {
    const shapes = fs.readdirSync(shapesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(shapesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        try {
          const data = JSON.parse(content);
          return {
            id: file.replace('.json', ''),
            name: data.name,
            created: data.created,
            preview: data.svgData
          };
        } catch (e) {
          console.error(`Error parsing ${file}:`, e);
          return null;
        }
      })
      .filter(Boolean);
    
    res.json(shapes);
  } catch (error) {
    console.error('Error listing shapes:', error);
    res.status(500).json({ error: 'Failed to list shapes', details: error.message });
  }
});

// API endpoint to get a specific shape by ID
app.get('/api/shapes/:id', (req, res) => {
  try {
    const filename = `${req.params.id}.json`;
    const filePath = path.join(shapesDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Shape not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const shape = JSON.parse(content);
    
    res.json(shape);
  } catch (error) {
    console.error('Error getting shape:', error);
    res.status(500).json({ error: 'Failed to get shape', details: error.message });
  }
});

// API endpoint to delete a shape
app.delete('/api/shapes/:id', (req, res) => {
  try {
    const filename = `${req.params.id}.json`;
    const filePath = path.join(shapesDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Shape not found' });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({ success: true, message: 'Shape deleted' });
  } catch (error) {
    console.error('Error deleting shape:', error);
    res.status(500).json({ error: 'Failed to delete shape', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Shape API server running on port ${PORT}`);
});
