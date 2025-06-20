/**
 * Example shape data for demonstration and documentation purposes
 */

export const exampleShapeData = {
  id: "shape-1",
  name: "Sample Complex Shape",
  width: 300,
  height: 200,
  position: {
    svg: { x: 0, y: 0 },  // Position within the SVG coordinate system
    global: { x: 100, y: 100 } // Global position of the shape in the application
  },
  animations: {
    duration: 3, // Total animation duration in seconds
    loops: 0,    // 0 means infinite loop, any positive number means that many loops
    controlPointAnimations: {
      "cp-1": {  // Basic sine wave with expression
        formula: {
          x: {
            // Custom mathematical expression for x
            expression: "50 + 50 * sin(TWO_PI * n)",
            // This is equivalent to the previous sine wave definition
            // but now written as a direct expression
          },
          y: {
            // Simple constant expression
            expression: "50"
          }
        }
      },
      "cp-3": {  // Complex combined waves
        formula: {
          x: {
            // Combine multiple sine waves with different frequencies and amplitudes
            expression: "100 + 15 * sin(TWO_PI * 2 * n) + 5 * sin(TWO_PI * 5 * n)",
            // This creates a primary wave with smaller ripples for a more organic look
          },
          y: {
            // Damped oscillation that decreases amplitude over time
            expression: "100 + 20 * sin(TWO_PI * n) * (1 - 0.5 * n)",
            // Oscillation that gradually reduces in amplitude
          }
        }
      },
      "cp-4": {  // Complex mathematical patterns with custom variables
        formula: {
          x: {
            // Bouncing effect with elastic overshoot
            expression: "150 + 30 * sin(TWO_PI * 2 * n) * exp(-5 * n)",
            // This creates a spring-like motion that dampens over time
          },
          y: {
            // Combined sinusoidal motion with custom variables
            expression: "baseY + amp1 * sin(TWO_PI * freq1 * n) + amp2 * sin(TWO_PI * freq2 * n + phase)",
            variables: {
              baseY: 100,
              amp1: 15,
              freq1: 1,
              amp2: 5,
              freq2: 3,
              phase: Math.PI / 2
            }
          }
        }
      }
    },
    positionAnimations: {
      global: { // Animate the global position
        keyframes: [
          // { time: 0, x: 100, y: 100 },
          // { time: 1.5, x: 150, y: 150 },
          // { time: 3.0, x: 100, y: 100 }
        ]
      }
    }
  },
  controlPoints: [
    { id: "cp-1", x: 50, y: 50, type: "anchor" },
    { id: "cp-2", x: 100, y: 50, type: "control" },
    { id: "cp-3", x: 100, y: 100, type: "control" },
    { id: "cp-4", x: 150, y: 100, type: "anchor" },
    { id: "cp-5", x: 150, y: 150, type: "anchor" },
    { id: "cp-6", x: 200, y: 150, type: "anchor" }
  ],
  segments: [
    {
      id: "seg-1",
      type: "bezier",
      points: ["cp-1", "cp-2", "cp-3", "cp-4"], // Start, Control1, Control2, End
      style: { stroke: "#ff0000", strokeWidth: 2 }
    },
    {
      id: "seg-2",
      type: "line",
      points: ["cp-4", "cp-5"], // Start, End
      style: { stroke: "#00ff00", strokeWidth: 2 }
    },
    {
      id: "seg-3",
      type: "line",
      points: ["cp-5", "cp-6"], // Start, End
      style: { stroke: "#0000ff", strokeWidth: 2 }
    }
  ],
  // Configuration for the combined path fill
  fillPath: true,
  closePath: true,
  style: {
    fill: "rgba(120, 200, 255, 0.3)", // Semi-transparent blue fill
    fillOpacity: 0.5,
    stroke: "#ffffff",
    strokeWidth: 1
  }
};
