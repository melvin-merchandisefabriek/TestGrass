import React, { useState, useEffect } from 'react';
import './App.css';
import Circle from './components/Circle';
import UI from './components/UI';
import Environment from './components/Environment';

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
        <Circle cx={60} cy={60} r={30} strokeWidth={4} stroke="blue"/>
        <UI />
        <Environment />
    </div>
  );
}

export default App;
