import React, { useState } from 'react';

export default function SharedAnimatedTrianglesConfigEditor() {
  const [vertices, setVertices] = useState('0.0,0.8,1,0,-0.8,0.0,0,1,0.8,0.0,0,1,0.0,-0.8,1,1,0.8,-0.8,0,1');
  const [indices, setIndices] = useState('0,1,2,3,1,2,4,2,3');
  const [colorExpr, setColorExpr] = useState('float t = (vY + 0.8) / 1.6;\noutColor = mix(vec4(0.0, 0.05, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), t);');
  const [positionExpr, setPositionExpr] = useState('float t = (sin(time * 0.001 + triIndex * 1.5) + 1.0) * 0.5;\npos.x += t * pos.y;');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const config = {
      vertices: vertices.split(',').map(Number),
      indices: indices.split(',').map(Number),
      colorExpr,
      positionExpr
    };
    try {
      const res = await fetch('/api/shared-animated-triangles-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setResult(data.success ? 'Success!' : 'Error: ' + (data.error || 'Unknown error'));
    } catch (err) {
      setResult('Network error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{background:'#222',color:'#fff',padding:16,borderRadius:8,maxWidth:500,margin:'2em auto'}}>
      <h3>Edit SharedAnimatedTriangles Config</h3>
      <label>Vertices (comma separated):<br/>
        <textarea value={vertices} onChange={e => setVertices(e.target.value)} rows={2} style={{width:'100%'}} />
      </label><br/>
      <label>Indices (comma separated):<br/>
        <textarea value={indices} onChange={e => setIndices(e.target.value)} rows={1} style={{width:'100%'}} />
      </label><br/>
      <label>Color Expression (GLSL):<br/>
        <textarea value={colorExpr} onChange={e => setColorExpr(e.target.value)} rows={3} style={{width:'100%'}} />
      </label><br/>
      <label>Position Expression (GLSL):<br/>
        <textarea value={positionExpr} onChange={e => setPositionExpr(e.target.value)} rows={3} style={{width:'100%'}} />
      </label><br/>
      <button type="submit" style={{marginTop:8}}>Send</button>
      {result && <div style={{marginTop:8}}>{result}</div>}
    </form>
  );
}
