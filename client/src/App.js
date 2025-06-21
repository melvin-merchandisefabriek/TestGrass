import React, { useState, useEffect } from 'react';
import './App.css';
import UI from './components/UI';
import Environment from './components/Environment';
import Player from './components/Player';
import Shape from './components/Shape';

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
        <UI />
        <Environment />
        <Player />
        {/* <Shape filePath={process.env.PUBLIC_URL + '/data/circleTemplate.json'} /> */}
    </div>
  );
}

export default App;
