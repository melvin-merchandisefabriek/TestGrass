import React, { useState, useEffect } from 'react';
import Shape from './Shape';
import { getGrassBladeData } from './TriangleArray';
import AddShapeForm from './AddShapeForm';

const trianglePath = process.env.PUBLIC_URL + '/data/triangleShape.json';

const UnifiedSceneSVG = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [shapes, setShapes] = useState([]); // dynamic shapes from server list

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch dynamic shapes list once
  useEffect(() => {
    let isMounted = true;
    fetch('/api/shapes')
      .then(r => r.json())
      .then(data => {
        if (isMounted && data && Array.isArray(data.shapes)) {
          setShapes(data.shapes);
        }
      })
      .catch(() => { /* silent fail for now */ });
    return () => { isMounted = false; };
  }, []);

  const { width, height } = windowSize;
  const viewBox = `0 0 ${width} ${height}`;

  // Get animated grass blade data from TriangleArray.js, pass width for spacing
  const blades = getGrassBladeData(150, width, height);
  console.log('unc - width:', width);

  return (
    <>
      <AddShapeForm onAdded={(entry) => setShapes(prev => [...prev, entry])} />
      {/* Simple list of dynamic shapes with remove buttons */}
      <div style={{ position: 'fixed', top: 10, right: 10, background: '#111', color: '#eee', padding: 8, fontSize: 12, border: '1px solid #444', maxHeight: '50vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Shapes</div>
        {shapes.length === 0 && <div style={{ opacity: 0.6 }}>None</div>}
        {shapes.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ flex: 1 }}>{s.id}</span>
            <button style={{ padding: '2px 4px' }} onClick={() => {
              fetch(`/api/shapes/${s.id}`, { method: 'DELETE' })
                .then(r => r.json().then(data => ({ ok: r.ok, data })))
                .then(({ ok }) => {
                  if (ok) setShapes(prev => prev.filter(p => p.id !== s.id));
                })
                .catch(() => {});
            }}>x</button>
          </div>
        ))}
      </div>
      <svg
        width="100vw"
        height="100vh"
        viewBox={viewBox}
        style={{ display: 'block', background: '#222' }}
      >
        {/* Grass blades as Shape components rendered as SVG groups */}
        {blades.map((blade, idx) => (
          <Shape
            key={idx}
            filePath={trianglePath}
            shapeModifications={{
              modifyPosition: { svg: blade.position, global: undefined},
              animations: { controlPointAnimations: blade.controlPointAnimations, styleAnimations: { fill: blade.fill } }
            }}
            renderAsGroup={true}
          />
        ))}
        {/* Dynamic shapes from server list */}
        {shapes.map(s => (
          <Shape
            key={`dyn-${s.id}`}
            filePath={(process.env.PUBLIC_URL || '') + s.path}
            renderAsGroup={true}
          />
        ))}
        {/* Debug squares at the four corners of the SVG */}
        <rect x={0} y={0} width={40} height={40} fill="red" />
        <rect x={width-40} y={0} width={40} height={40} fill="green" />
        <rect x={0} y={height-40} width={40} height={40} fill="blue" />
        <rect x={width-40} y={height-40} width={40} height={40} fill="yellow" />
        {/* All other shapes/paths will go here in later steps */}
      </svg>
    </>
  );
};

export default UnifiedSceneSVG;
