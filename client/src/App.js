import React, { useState, useEffect } from 'react';
import './App.css';
import UI from './components/UI';
import SharedAnimatedTrianglesConfigEditor from './components/SharedAnimatedTrianglesConfigEditor';
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

  // Display JS errors as a red banner at the top of the page
  useEffect(() => {
    window.onerror = function(message, source, lineno, colno, error) {
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '0';
      errorDiv.style.left = '0';
      errorDiv.style.width = '100vw';
      errorDiv.style.background = 'rgba(255,0,0,0.9)';
      errorDiv.style.color = 'white';
      errorDiv.style.zIndex = '9999';
      errorDiv.style.padding = '1em';
      errorDiv.style.fontSize = '1em';
      errorDiv.innerText = `Error: ${message}\n${error && error.stack ? error.stack : ''}`;
      document.body.appendChild(errorDiv);
    };
  }, []);

  return (
    <div className="App">
        <SharedAnimatedTrianglesConfigEditor />
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
