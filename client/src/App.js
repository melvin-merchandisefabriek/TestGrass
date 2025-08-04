import React, { useState, useEffect } from 'react';
import './App.css';
import UI from './components/UI';
import Environment from './components/Environment';
import Player from './components/Player';
import Shape from './components/Shape';
import UnifiedSceneSVG from './components/UnifiedSceneSVG';
import MinimalDot from './components/MinimalDot';
import GrassBladeWebGLDemo from './components/GrassBladeWebGLDemo';
import ShapeWebGLDemo from './components/ShapeWebGLDemo';
import GrassFieldWebGL from './components/GrassFieldWebGL';
import BladeGPUAnimated from './components/BladeGPUAnimated';
import SimpleWebGLTriangle from './components/SimpleWebGLTriangle';
import AnimatedWebGLTriangle from './components/AnimatedWebGLTriangle';
import SharedAnimatedTriangles from './components/SharedAnimatedTriangles';
import BezierShapeDemo from './BezierShapeDemo';

function App() {
  const [message, setMessage] = useState('Hello World!');
  
  useEffect(() => {
    // You can uncomment this to fetch from the API endpoint
    // fetch('/api/hello')
    //   .then(response => response.json())
    //   .then(data => setMessage(data.message));
  }, []);

  return (
    <div className="App">
        <SharedAnimatedTriangles />
        {/* <AnimatedWebGLTriangle /> */}
        {/* <SimpleWebGLTriangle /> */}
        {/* <BladeGPUAnimated /> */}
        {/* <BezierShapeDemo /> */}
        {/* <MinimalDot /> */}
        {/* <GrassFieldWebGL bladeCount={500} /> */}
        {/* <ShapeWebGLDemo /> */}
        {/* <UnifiedSceneSVG /> */}
        {/* <UI /> */}
        {/* <Environment /> */}
        {/* <Player /> */}
        {/* <Shape filePath={process.env.PUBLIC_URL + '/data/circleTemplate.json'} /> */}
    </div>
  );
}

export default App;
