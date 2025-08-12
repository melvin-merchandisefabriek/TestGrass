import React, { useState, useEffect } from 'react';
import './assets/styles/App.css';
import UI from './core/services/UI';
import SharedAnimatedTrianglesConfigEditor from './core/services/SharedAnimatedTrianglesConfigEditor';
import Environment from './core/services/Environment';
import Player from './core/services/Player';
import Shape from './core/services/Shape';
import UnifiedSceneSVG from './svg/components/UnifiedSceneSVG';
import MinimalDot from './core/services/MinimalDot';
import GrassBladeWebGLDemo from './webgl/components/GrassBladeWebGLDemo';
import ShapeWebGLDemo from './webgl/components/ShapeWebGLDemo';
import GrassFieldWebGL from './webgl/components/GrassFieldWebGL';
import BladeGPUAnimated from './webgl/components/BladeGPUAnimated';
import SimpleWebGLTriangle from './webgl/components/SimpleWebGLTriangle';
import AnimatedWebGLTriangle from './webgl/components/AnimatedWebGLTriangle';
import SharedAnimatedTriangles from './core/services/SharedAnimatedTriangles';
import BezierShapeDemo from './webgl/examples/BezierShapeDemo';

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
