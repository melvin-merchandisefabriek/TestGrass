import React from "react";
import GrassField from "./GrassField";

function App() {
  return (
    <div style={{ padding: 32 }}>
      <h2>Interactive Grass Field Demo</h2>
      <GrassField width={600} height={500} bladeCount={80} />
    </div>
  );
}

export default App;
