import React, { useState } from "react";
import GrassField from "./GrassField";
import BezierEditor from "./BezierEditor";

function App() {
  const [activeComponent, setActiveComponent] = useState("bezierEditor");
  return (
    <div style={{ padding: 0, minHeight: "100vh", background: "#f5f5f5" }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          zIndex: 10,
          background: "#222",
          padding: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setActiveComponent("grassField")}
          style={{
            marginLeft: 24,
            marginRight: 10,
            padding: "8px 18px",
            background:
              activeComponent === "grassField" ? "#4CAF50" : "#444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Grass Field
        </button>
        <button
          onClick={() => setActiveComponent("bezierEditor")}
          style={{
            padding: "8px 18px",
            background:
              activeComponent === "bezierEditor" ? "#4CAF50" : "#444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Bezier Editor
        </button>
      </div>
      <div style={{ paddingTop: 56 }}>
        {activeComponent === "grassField" ? (
          <GrassField width={1000} height={700} bladeCount={40} />
        ) : (
          <BezierEditor width={1000} height={700} />
        )}
      </div>
    </div>
  );
}

export default App;
