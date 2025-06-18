import React, { useState, useEffect, useRef, useCallback } from "react";

export default function SeedTerrain({ width: propsWidth = 1000, height: propsHeight = 700 }) {
  // Use window dimensions to ensure we fill the available space
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  // Use the larger of props or window dimensions
  const width = Math.max(propsWidth, dimensions.width);
  const height = Math.max(propsHeight, dimensions.height);
  
  // Use refs for values that need to be accessed in animation frames without causing re-renders
  const offsetRef = useRef(0);
  const [displayOffset, setDisplayOffset] = useState(0); // For display purposes only
  const lastTimeRef = useRef(0); // For tracking time between frames
  const [seed, setSeed] = useState(12345); // Initial seed
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const terrainSegments = useRef({});
  const segmentWidth = 200; // Width of each terrain segment
  const visibleSegmentsCount = Math.ceil(width / segmentWidth) + 4; // +4 for buffer
  const groundHeight = height / 3; // One third of screen height for ground
  const movementSpeed = 300; // Units per second (for smooth time-based movement)
  const [isLeftDown, setIsLeftDown] = useState(false);
  const [isRightDown, setIsRightDown] = useState(false);
  
  // Sphere properties
  const sphereRadius = 25;
  const sphereY = height - groundHeight - sphereRadius - 10; // Position sphere just above the ground
  const sphereXRef = useRef(width / 2);
  const [displaySphereX, setDisplaySphereX] = useState(width / 2); // For display purposes only
  
  // Generate a new terrain segment with seed-based pseudo-random noise
  const generateTerrainSegment = (segmentX) => {
    // Return cached segment if it exists
    if (terrainSegments.current[segmentX]) {
      return terrainSegments.current[segmentX];
    }
    
    const segmentPoints = [];
    const segmentPointCount = 12;
    const segmentHeight = groundHeight / 2;
    
    // Use the seed combined with position for consistent, position-dependent generation
    // Multiplying by 0.71 (a prime-related value) helps reduce obvious patterns
    const segmentSeed = seed + Math.abs(segmentX) * 0.71;
    
    // Create more natural-looking terrain with multiple frequency components
    for (let i = 0; i <= segmentPointCount; i++) {
      const xPos = segmentX + (i / segmentPointCount) * segmentWidth;
      
      // Use a seeded pseudorandom function based on the segment position and point index
      // Combining multiple sine waves with different frequencies for more natural terrain
      const heightSeed = 
        Math.sin(segmentSeed * 0.01 + i * 0.5) * 0.5 + 
        Math.cos(segmentSeed * 0.02 + i * 0.3) * 0.3 +
        Math.sin(segmentSeed * 0.05 + i * 0.7) * 0.2;
        
      // Apply the variation to create the terrain height
      const yVariation = heightSeed * (segmentHeight * 0.7); 
      const yPos = height - groundHeight + yVariation;
      
      segmentPoints.push({ x: xPos, y: yPos });
    }
    
    // Cache the generated segment
    terrainSegments.current[segmentX] = segmentPoints;
    return segmentPoints;
  };
  
  // Get or generate terrain segments for current view
  const getVisibleTerrain = (currentOffset) => {
    // Calculate start position of the leftmost visible segment
    const startSegmentIndex = Math.floor(currentOffset / segmentWidth) - 2; // 2 extra segments buffer
    const endSegmentIndex = startSegmentIndex + visibleSegmentsCount + 4; // 4 extra segments buffer
    
    const visibleTerrain = [];
    
    // Generate the necessary segments
    for (let i = startSegmentIndex; i <= endSegmentIndex; i++) {
      const segmentX = i * segmentWidth;
      const points = generateTerrainSegment(segmentX);
      
      visibleTerrain.push({
        startX: segmentX,
        points: points
      });
    }
    
    return visibleTerrain;
  };
  
  // Find the ground Y position at a specific X coordinate (used for sphere collision)
  const findGroundYAtPosition = (x, currentOffset) => {
    const absoluteX = x + currentOffset;
    const segmentIndex = Math.floor(absoluteX / segmentWidth);
    const segmentX = segmentIndex * segmentWidth;
    
    const points = generateTerrainSegment(segmentX);
    
    // Find the two points in the segment that surround our x position
    const segmentRelativeX = absoluteX - segmentX;
    const pointDistance = segmentWidth / (points.length - 1);
    const leftPointIndex = Math.floor(segmentRelativeX / pointDistance);
    const rightPointIndex = Math.min(leftPointIndex + 1, points.length - 1);
    
    // Edge case: x is at or beyond the right edge of the segment
    if (leftPointIndex >= points.length - 1) {
      return points[points.length - 1].y;
    }
    
    // Get the two surrounding points
    const leftPoint = points[leftPointIndex];
    const rightPoint = points[rightPointIndex];
    
    // Calculate the interpolation factor between the two points (0 to 1)
    const lerpFactor = (segmentRelativeX - leftPointIndex * pointDistance) / pointDistance;
    
    // Linearly interpolate between the two point heights
    return leftPoint.y * (1 - lerpFactor) + rightPoint.y * lerpFactor;
  };
  
  // Draw the visible terrain and the sphere
  const draw = (ctx) => {
    const currentOffset = offsetRef.current;
    const terrain = getVisibleTerrain(currentOffset);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height - groundHeight + 50);
    skyGradient.addColorStop(0, "#3498db"); // Darker blue at top
    skyGradient.addColorStop(1, "#87CEEB"); // Lighter blue near horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some simple clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(100 - (currentOffset * 0.02) % (width + 200), 100, 40, 0, Math.PI * 2);
    ctx.arc(130 - (currentOffset * 0.02) % (width + 200), 120, 40, 0, Math.PI * 2);
    ctx.arc(160 - (currentOffset * 0.02) % (width + 200), 90, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width - 100 - (currentOffset * 0.03) % (width + 300), 150, 50, 0, Math.PI * 2);
    ctx.arc(width - 150 - (currentOffset * 0.03) % (width + 300), 130, 40, 0, Math.PI * 2);
    ctx.arc(width - 180 - (currentOffset * 0.03) % (width + 300), 160, 45, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw ground with gradient
    const groundGradient = ctx.createLinearGradient(0, height - groundHeight, 0, height);
    groundGradient.addColorStop(0, "#2ECC71"); // Grass green at top
    groundGradient.addColorStop(1, "#27AE60"); // Darker green at bottom
    ctx.fillStyle = groundGradient;
    
    // Start path for the complete terrain
    ctx.beginPath();
    let pathStarted = false;
    
    // Draw each segment
    terrain.forEach(segment => {
      // Skip segments that are definitely out of view (with buffer)
      if (segment.startX + segmentWidth < currentOffset - segmentWidth || 
          segment.startX > currentOffset + width + segmentWidth) {
        return;
      }
      
      // Draw each segment
      segment.points.forEach((point, i) => {
        const x = point.x - currentOffset;
        const y = point.y;
        
        if (!pathStarted) {
          ctx.moveTo(x, y);
          pathStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
    });
    
    // Complete the path by extending to the bottom corners
    if (pathStarted) {
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      
      // Add terrain detail
      ctx.strokeStyle = "#27AE60";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Add some simple grass details on top of the terrain
    terrain.forEach(segment => {
      if (segment.startX + segmentWidth < currentOffset - segmentWidth || 
          segment.startX > currentOffset + width + segmentWidth) {
        return;
      }
      
      // Add simple grass tufts at some points
      for (let i = 0; i < segment.points.length; i += 2) {
        const point = segment.points[i];
        const x = point.x - currentOffset;
        const y = point.y;
        
        // Only add grass at some points based on position
        if ((x + segment.startX) % 70 < 30) {
          ctx.strokeStyle = "#2ECC71";
          ctx.lineWidth = 2;
          const grassHeight = 5 + Math.sin(segment.startX * 0.1) * 5;
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 3, y - grassHeight);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 3, y - grassHeight);
          ctx.stroke();
        }
      }
    });
    
    // Draw the sphere
    const spherePosition = sphereXRef.current;
    
    // Calculate the ground height at sphere's position for collision detection
    const groundY = findGroundYAtPosition(spherePosition, currentOffset);
    const sphereGroundY = Math.min(sphereY, groundY - sphereRadius);
    
    // Draw shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(spherePosition, groundY, sphereRadius * 0.8, sphereRadius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sphere with gradient
    const sphereGradient = ctx.createRadialGradient(
      spherePosition - sphereRadius * 0.3, sphereGroundY - sphereRadius * 0.3, 0,
      spherePosition, sphereGroundY, sphereRadius
    );
    sphereGradient.addColorStop(0, "#f39c12"); // Light orange
    sphereGradient.addColorStop(1, "#d35400"); // Darker orange
    
    ctx.fillStyle = sphereGradient;
    ctx.beginPath();
    ctx.arc(spherePosition, sphereGroundY, sphereRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(
      spherePosition - sphereRadius * 0.3,
      sphereGroundY - sphereRadius * 0.3,
      sphereRadius * 0.4,
      0, Math.PI * 2
    );
    ctx.fill();
    
    // Update display values (for UI) once per animation frame - but don't make it trigger re-renders during the animation
    setDisplayOffset(Math.round(currentOffset));
    setDisplaySphereX(Math.round(spherePosition));
  };
  
  // Animation loop with smooth time-based movement
  const animate = useCallback((timestamp) => {
    if (!canvasRef.current) return;
    
    // Calculate delta time for smooth movement regardless of frame rate
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = timestamp;
    
    // Calculate movement distance based on time elapsed
    const moveDistance = movementSpeed * deltaTime;
    
    // Calculate movement direction
    let moveX = 0;
    if (isLeftDown) moveX -= moveDistance;
    if (isRightDown) moveX += moveDistance;
    
    // Apply movement
    if (moveX !== 0) {
      const currentSphereX = sphereXRef.current;
      let newSphereX = currentSphereX + moveX;
      
      // Clamp sphere position to screen boundaries
      newSphereX = Math.max(sphereRadius, Math.min(width - sphereRadius, newSphereX));
      
      // If sphere would move beyond threshold, move terrain instead
      if ((newSphereX <= width * 0.3 && moveX < 0) || (newSphereX >= width * 0.7 && moveX > 0)) {
        // Move terrain in opposite direction to give illusion of sphere movement
        offsetRef.current -= moveX;
        // Keep sphere in same position
      } else {
        // Update sphere position
        sphereXRef.current = newSphereX;
      }
    }
    
    const ctx = canvasRef.current.getContext("2d");
    draw(ctx);
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(animate);
  }, [isLeftDown, isRightDown]);
  
  // Set up keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        setIsLeftDown(true);
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        setIsRightDown(true);
      } 
      // For changing the seed with number keys
      else if (e.key >= "1" && e.key <= "9") {
        // Set a new seed based on key pressed (1-9)
        const newSeed = parseInt(e.key) * 12345;
        setSeed(newSeed);
        // Clear cached terrain when seed changes
        terrainSegments.current = {};
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        setIsLeftDown(false);
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        setIsRightDown(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  
  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    // Set initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize animation
  useEffect(() => {
    // Reset terrain cache when seed changes
    terrainSegments.current = {};
    
    // Reset time tracking
    lastTimeRef.current = 0;
    
    // Start the animation loop
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, seed]);
  
  return (
    <div 
      style={{ 
        overflow: "hidden", 
        position: "relative", 
        height: "100vh",
        width: "100%"
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none" // Prevent browser handling of all panning and zooming gestures
        }}
      />
      
      <div style={{ 
        position: "absolute", 
        top: 20, 
        left: "50%", 
        transform: "translateX(-50%)",
        color: "white",
        background: "rgba(0,0,0,0.7)",
        padding: "10px 20px",
        borderRadius: 8,
        fontWeight: "bold",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        zIndex: 100
      }}>
        Use A and D keys to move the sphere | Press 1-9 to change seeds
      </div>
      
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 100
      }}>
        <button 
          onClick={() => {
            const event = new CustomEvent('showNavigation');
            window.dispatchEvent(event);
          }}
          style={{
            padding: "8px 15px",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 5
          }}
        >
          ← Back
        </button>
      </div>
      
      <div style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        color: "white",
        background: "rgba(0,0,0,0.5)",
        padding: "8px 12px",
        borderRadius: 4,
        fontSize: 14
      }}>
        <div>Position: {displayOffset}</div>
        <div>Sphere X: {displaySphereX}</div>
        <div>Current Seed: {seed}</div>
      </div>
    </div>
  );
}
