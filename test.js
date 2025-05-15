const React = require("react");

// Simple 1D Perlin-like noise (not true Perlin, but good for wind)
function lerp(a, b, t) {
  return a + (b - a) * t;
  }
  function fade(t) {
    // Perlin fade curve
      return t * t * t * (t * (t * 6 - 15) + 10);
      }
      function pseudoRandom(seed) {
        // Deterministic pseudo-random for a given seed
          return (Math.sin(seed * 9999.1) * 43758.5453) % 1;
          }
          function perlin1D(x) {
            const x0 = Math.floor(x);
              const x1 = x0 + 1;
                const t = x - x0;
                  const fadeT = fade(t);
                    const grad0 = pseudoRandom(x0);
                      const grad1 = pseudoRandom(x1);
                        return lerp(grad0, grad1, fadeT);
                        }

                        function GrassField(props) {
                          const bladeCount = props.bladeCount || 70;
                            const width = props.width || 500;
                              const height = props.height || 500;
                                const [tick, setTick] = React.useState(0);
                                  React.useEffect(() => {
                                      let running = true;
                                          function animate() {
                                                if (!running) return;
                                                      setTick((t) => t + 1);
                                                            requestAnimationFrame(animate);
                                                                }
                                                                    animate();
                                                                        return () => {
                                                                              running = false;
                                                                                  };
                                                                                    }, []);

                                                                                      // Grass blade parameters
                                                                                        const blades = [];
                                                                                          for (let i = 0; i < bladeCount; i++) {
                                                                                              const baseX = lerp(30, width - 30, i / (bladeCount - 1));
                                                                                                  const baseY = height - 40;
                                                                                                      const bladeLen = lerp(90, 160, pseudoRandom(i));
                                                                                                          const curve = lerp(30, 60, pseudoRandom(i + 100));
                                                                                                              // Wind offset using perlin noise
                                                                                                                  const windT = tick * 0.015;
                                                                                                                      const wind =
                                                                                                                            perlin1D(i * 0.18 + windT) * 32 + perlin1D(i * 0.5 + windT * 0.5) * 10;
                                                                                                                                // Control point (bend)
                                                                                                                                    const ctrlX = baseX + wind + lerp(-10, 10, pseudoRandom(i + 200));
                                                                                                                                        const ctrlY = baseY - bladeLen * 0.6 + lerp(-10, 10, pseudoRandom(i + 300));
                                                                                                                                            // Tip
                                                                                                                                                const tipX = baseX + wind * 0.5 + lerp(-8, 8, pseudoRandom(i + 400));
                                                                                                                                                    const tipY = baseY - bladeLen + lerp(-8, 8, pseudoRandom(i + 500));
                                                                                                                                                        // Color variation
                                                                                                                                                            const green = Math.floor(lerp(120, 180, pseudoRandom(i + 600)));
                                                                                                                                                                const color = `rgb(30,${green},30)`;
                                                                                                                                                                    blades.push(
                                                                                                                                                                          React.createElement("path", {
                                                                                                                                                                                  key: i,
                                                                                                                                                                                          d: `M ${baseX} ${baseY} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`,
                                                                                                                                                                                                  stroke: color,
                                                                                                                                                                                                          strokeWidth: 4,
                                                                                                                                                                                                                  fill: "none",
                                                                                                                                                                                                                          strokeLinecap: "round",
                                                                                                                                                                                                                                  opacity: 0.85,
                                                                                                                                                                                                                                        })
                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                return React.createElement(
                                                                                                                                                                                                                                                    "div",
                                                                                                                                                                                                                                                        null,
                                                                                                                                                                                                                                                            React.createElement(
                                                                                                                                                                                                                                                                  "svg",
                                                                                                                                                                                                                                                                        {
                                                                                                                                                                                                                                                                                width: width,
                                                                                                                                                                                                                                                                                        height: height,
                                                                                                                                                                                                                                                                                                viewBox: `0 0 ${width} ${height}`,
                                                                                                                                                                                                                                                                                                        style: {
                                                                                                                                                                                                                                                                                                                  background: "linear-gradient(to top, #b3e6b3 0%, #e0ffe0 100%)",
                                                                                                                                                                                                                                                                                                                            borderRadius: 16,
                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                                                                                                // Ground
                                                                                                                                                                                                                                                                                                                                                      React.createElement("rect", {
                                                                                                                                                                                                                                                                                                                                                              x: 0,
                                                                                                                                                                                                                                                                                                                                                                      y: height - 40,
                                                                                                                                                                                                                                                                                                                                                                              width: width,
                                                                                                                                                                                                                                                                                                                                                                                      height: 40,
                                                                                                                                                                                                                                                                                                                                                                                              fill: "#4b8b3b",
                                                                                                                                                                                                                                                                                                                                                                                                    }),
                                                                                                                                                                                                                                                                                                                                                                                                          // Grass blades
                                                                                                                                                                                                                                                                                                                                                                                                                ...blades
                                                                                                                                                                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                                                                      module.exports = GrassField;