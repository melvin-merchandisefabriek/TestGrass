import React, { useState, useRef, useEffect } from "react";
import { getCollections, saveCollection, deleteCollection, generateCollectionId, instantiateWithTransform, transformPaths } from "./BezierCollections";

// Default paths to use if no saved data exists
const defaultPaths = [
  {
    id: "path1",
    name: "Side 1",
    color: "#e74c3c",
    groupId: null,
    points: {
      start: { x: 400, y: 100 },
      control1: { x: 350, y: 200 },
      control2: { x: 250, y: 250 },
      end: { x: 200, y: 300 },
    },
  },
  {
    id: "path2",
    name: "Side 2",
    color: "#2ecc71",
    groupId: null,
    points: {
      start: { x: 200, y: 300 },
      control1: { x: 300, y: 350 },
      control2: { x: 500, y: 350 },
      end: { x: 600, y: 300 },
    },
  },
  {
    id: "path3",
    name: "Side 3",
    color: "#3498db",
    groupId: null,
    points: {
      start: { x: 600, y: 300 },
      control1: { x: 550, y: 200 },
      control2: { x: 500, y: 150 },
      end: { x: 400, y: 100 },
    },
  },
];

export default function BezierEditor({ width = 1000, height = 700, collectionMode = false }) {
  // Get saved data from localStorage or use defaults
  const getInitialPaths = () => {
    const savedPaths = localStorage.getItem('bezierEditorPaths');
    return savedPaths ? JSON.parse(savedPaths) : defaultPaths;
  };
  
  const getInitialGroups = () => {
    const savedGroups = localStorage.getItem('bezierEditorGroups');
    return savedGroups ? JSON.parse(savedGroups) : [];
  };

  const getInitialKeyframes = () => {
    const savedKeyframes = localStorage.getItem('bezierEditorKeyframes');
    return savedKeyframes ? JSON.parse(savedKeyframes) : [];
  };
  
  const getInitialLoopSetting = () => {
    const savedLoopSetting = localStorage.getItem('bezierEditorLoopSetting');
    return savedLoopSetting !== null ? JSON.parse(savedLoopSetting) : true; // Default to true
  };

  // Path data structure
  const [paths, setPaths] = useState(getInitialPaths());

  // Groups for organizing multiple paths
  const [groups, setGroups] = useState(getInitialGroups());

  // Animation keyframes and controls
  const [keyframes, setKeyframes] = useState(getInitialKeyframes());
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(60); // Default 60 frames (2 seconds at 30fps)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x speed
  const [animationMode, setAnimationMode] = useState(false); // Animation editor mode
  const [loopAnimation, setLoopAnimation] = useState(getInitialLoopSetting()); // Load loop setting from localStorage
  
  const animationRef = useRef(null);

  // Save state indicator
  const [saveIndicator, setSaveIndicator] = useState(false);
  
  // Collections mode state
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [collectionNameInput, setCollectionNameInput] = useState("");
  const [collectionDescriptionInput, setCollectionDescriptionInput] = useState("");
  const [collectionTagsInput, setCollectionTagsInput] = useState("");
  const [transformValues, setTransformValues] = useState({
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    flipX: false,
    flipY: false
  });
  const [showTransformPanel, setShowTransformPanel] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  
  // State for tracking selections, dragging, and path operations
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [pathConnectionMode, setPathConnectionMode] = useState(true);
  const [pathHistory, setPathHistory] = useState([]); // for undo functionality

  const svgRef = useRef(null);

  // Add to history before any change
  const addToHistory = () => {
    setPathHistory((prev) => [
      ...prev.slice(-9),
      {
        paths: JSON.parse(JSON.stringify(paths)),
        groups: JSON.parse(JSON.stringify(groups)),
      },
    ]);
  };

  // Undo last change
  const handleUndo = () => {
    if (pathHistory.length > 0) {
      const lastState = pathHistory[pathHistory.length - 1];
      setPaths(lastState.paths);
      setGroups(lastState.groups);
      setPathHistory((prev) => prev.slice(0, -1));
    }
  };
  
  // Animation functions
  
  // Create a keyframe at the current frame
  const createKeyframe = () => {
    // Store the current state of paths and groups at the current frame
    const newKeyframe = {
      frame: currentFrame,
      paths: JSON.parse(JSON.stringify(paths)),
      groups: JSON.parse(JSON.stringify(groups))
    };
    
    // Check if a keyframe already exists at this frame
    const existingIndex = keyframes.findIndex(kf => kf.frame === currentFrame);
    
    if (existingIndex >= 0) {
      // Replace existing keyframe
      setKeyframes(prev => 
        prev.map((kf, i) => i === existingIndex ? newKeyframe : kf)
      );
    } else {
      // Add new keyframe and sort by frame number
      setKeyframes(prev => 
        [...prev, newKeyframe].sort((a, b) => a.frame - b.frame)
      );
    }
  };
  
  // Delete keyframe at current frame
  const deleteKeyframe = () => {
    setKeyframes(prev => prev.filter(kf => kf.frame !== currentFrame));
  };
  
  // Get keyframe at specific frame
  const getKeyframeAtFrame = (frame) => {
    return keyframes.find(kf => kf.frame === frame);
  };
  
  // Check if current frame has a keyframe
  const hasKeyframeAtCurrentFrame = () => {
    return keyframes.some(kf => kf.frame === currentFrame);
  };
  
  // Get previous and next keyframes relative to the current frame
  const getSurroundingKeyframes = (frame) => {
    const prevKeyframe = [...keyframes]
      .filter(kf => kf.frame <= frame)
      .sort((a, b) => b.frame - a.frame)[0];
      
    const nextKeyframe = [...keyframes]
      .filter(kf => kf.frame > frame)
      .sort((a, b) => a.frame - b.frame)[0];
      
    return { prevKeyframe, nextKeyframe };
  };
  
  // Interpolate between keyframes to get path state at the current frame
  const interpolatePaths = (frame) => {
    const { prevKeyframe, nextKeyframe } = getSurroundingKeyframes(frame);
    
    // If no keyframes or only at current frame, use current paths
    if (!prevKeyframe && !nextKeyframe) return paths;
    
    // If only have a previous keyframe, use that
    if (prevKeyframe && !nextKeyframe) return prevKeyframe.paths;
    
    // If only have a next keyframe, use that
    if (!prevKeyframe && nextKeyframe) return nextKeyframe.paths;
    
    // If current frame is exactly on a keyframe, use that keyframe's paths
    if (prevKeyframe.frame === frame) return prevKeyframe.paths;
    
    // Calculate interpolation factor (0 to 1)
    const totalFrames = nextKeyframe.frame - prevKeyframe.frame;
    const progress = (frame - prevKeyframe.frame) / totalFrames;
    
    // Interpolate each path
    return prevKeyframe.paths.map(prevPath => {
      const nextPath = nextKeyframe.paths.find(p => p.id === prevPath.id);
      
      // If path doesn't exist in next keyframe, return previous path
      if (!nextPath) return prevPath;
      
      // Deep copy the path
      const interpolatedPath = JSON.parse(JSON.stringify(prevPath));
      
      // Interpolate points positions
      Object.keys(prevPath.points).forEach(pointKey => {
        if (nextPath.points[pointKey]) {
          interpolatedPath.points[pointKey] = {
            x: prevPath.points[pointKey].x + ((nextPath.points[pointKey].x - prevPath.points[pointKey].x) * progress),
            y: prevPath.points[pointKey].y + ((nextPath.points[pointKey].y - prevPath.points[pointKey].y) * progress)
          };
        }
      });
      
      return interpolatedPath;
    });
  };
  
  // Start animation playback
  const startPlayback = () => {
    if (keyframes.length < 2) {
      alert("Create at least 2 keyframes to play animation");
      return;
    }
    
    setIsPlaying(true);
  };
  
  // Stop animation playback
  const stopPlayback = () => {
    setIsPlaying(false);
  };
  
  // Animation playback loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const minFrame = Math.min(...keyframes.map(kf => kf.frame));
    const maxFrame = Math.max(...keyframes.map(kf => kf.frame));
    
    // Animation frame function
    const animate = () => {
      setCurrentFrame(prev => {
        let next = prev + (1 * playbackSpeed);
        
        // Handle reaching the end based on loop setting
        if (next > maxFrame) {
          if (loopAnimation) {
            // Loop back to start if looping is enabled
            next = minFrame;
          } else {
            // Stop at the end if looping is disabled
            next = maxFrame;
            // Schedule stopping the animation on the next frame
            setTimeout(() => setIsPlaying(false), 0);
          }
        }
        
        return next;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, keyframes, playbackSpeed, loopAnimation]);
  
  // Update displayed paths when in animation mode or when frame changes
  useEffect(() => {
    if (!animationMode || keyframes.length === 0) return;
    
    // In animation mode, display interpolated paths for the current frame
    const interpolatedPaths = interpolatePaths(currentFrame);
    
    // Only update if we're playing or have different paths (don't interfere with editing)
    if (isPlaying) {
      setPaths(interpolatedPaths);
    }
  }, [currentFrame, animationMode, isPlaying]);

  // Generate a unique ID
  const generateId = (prefix = "path") => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // Find connected paths and points
  const findConnections = (pathId, pointKey) => {
    const connections = [];

    const currentPath = paths.find((p) => p.id === pathId);
    const currentPoint = currentPath?.points?.[pointKey];

    if (!currentPath || !currentPoint) return connections;

    // Find other paths with matching points
    paths.forEach((path) => {
      if (path.id === pathId) return;

      Object.entries(path.points).forEach(([key, point]) => {
        if (Math.abs(point.x - currentPoint.x) < 5 && Math.abs(point.y - currentPoint.y) < 5) {
          connections.push({ pathId: path.id, pointKey: key });
        }
      });
    });

    return connections;
  };

  // Add a new path
  const addPath = () => {
    addToHistory();

    // Create a default path in the center
    const newPath = {
      id: generateId(),
      name: `Path ${paths.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      groupId: null,
      points: {
        start: { x: width / 2 - 100, y: height / 2 },
        control1: { x: width / 2 - 50, y: height / 2 - 80 },
        control2: { x: width / 2 + 50, y: height / 2 - 80 },
        end: { x: width / 2 + 100, y: height / 2 },
      },
    };

    setPaths((prev) => [...prev, newPath]);
  };
  
  // Reset editor to default paths
  const resetEditor = () => {
    if (window.confirm("Are you sure you want to reset the editor? This will clear all your paths, groups, and animation keyframes.")) {
      addToHistory();
      setPaths(defaultPaths);
      setGroups([]);
      setSelectedPaths([]);
      setSelectedGroups([]);
      setKeyframes([]);
      setLoopAnimation(true);
      localStorage.removeItem('bezierEditorPaths');
      localStorage.removeItem('bezierEditorGroups');
      localStorage.removeItem('bezierEditorKeyframes');
      localStorage.removeItem('bezierEditorLoopSetting');
    }
  };

  // Remove a path
  const removePath = (pathId) => {
    addToHistory();
    setPaths((prev) => prev.filter((p) => p.id !== pathId));
  };

  // Duplicate a path
  const duplicatePath = (pathId, keepSelection = false) => {
    addToHistory();
    
    // Find the path to duplicate
    const originalPath = paths.find((p) => p.id === pathId);
    if (!originalPath) return null;
    
    // Create a copy with a new ID
    const newPath = {
      ...JSON.parse(JSON.stringify(originalPath)),
      id: generateId(),
      name: `${originalPath.name} (Copy)`,
    };
    
    // Offset the new path slightly so it's visible
    Object.keys(newPath.points).forEach(pointKey => {
      newPath.points[pointKey].x += 20;
      newPath.points[pointKey].y += 20;
    });
    
    setPaths((prev) => [...prev, newPath]);
    
    if (!keepSelection) {
      // Select only the new path
      setSelectedPaths([newPath.id]);
      setSelectedGroups([]);
    }
    
    return newPath.id;
  };
  
  // Duplicate a group
  const duplicateGroup = (groupId) => {
    addToHistory();
    
    // Find the group to duplicate
    const originalGroup = groups.find((g) => g.id === groupId);
    if (!originalGroup) return;
    
    // Create a new group with a new ID
    const newGroupId = generateId("group");
    const newGroup = {
      ...originalGroup,
      id: newGroupId,
      name: `${originalGroup.name} (Copy)`,
    };
    
    // Find all paths in the original group
    const groupPaths = paths.filter(path => path.groupId === groupId);
    const newPaths = groupPaths.map(originalPath => {
      const newPath = {
        ...JSON.parse(JSON.stringify(originalPath)),
        id: generateId(),
        groupId: newGroupId
      };
      
      // Offset the new path slightly so it's visible
      Object.keys(newPath.points).forEach(pointKey => {
        newPath.points[pointKey].x += 20;
        newPath.points[pointKey].y += 20;
      });
      
      return newPath;
    });
    
    // Add the new group and paths
    setGroups((prev) => [...prev, newGroup]);
    setPaths((prev) => [...prev, ...newPaths]);
    
    // Select the new group
    setSelectedGroups([newGroupId]);
    setSelectedPaths([]);
  };

  // Toggle selection of a path or group
  const togglePathSelection = (pathId, isShiftKey = false) => {
    // If path is in a group and the group is selected, handle differently
    const path = paths.find((p) => p.id === pathId);
    if (path?.groupId && selectedGroups.includes(path.groupId)) {
      // Toggle group selection instead
      setSelectedGroups((prev) => {
        if (prev.includes(path.groupId)) {
          return prev.filter((id) => id !== path.groupId);
        } else {
          return isShiftKey ? [...prev, path.groupId] : [path.groupId];
        }
      });
      return;
    }

    // Only clear existing selections if shift key is not pressed
    if (!isShiftKey) {
      setSelectedGroups([]);
      // For single click (non-shift), toggle the clicked path's selection status
      setSelectedPaths((prev) => {
        // If this is the only path selected and it's already selected, deselect it
        if (prev.includes(pathId) && prev.length === 1) {
          return [];
        } 
        // Otherwise, replace selection with just this path
        else {
          return [pathId];
        }
      });
    } else {
      // With shift key pressed, add/remove without affecting other selections
      setSelectedPaths((prev) => {
        if (prev.includes(pathId)) {
          return prev.filter((id) => id !== pathId);
        } else {
          return [...prev, pathId];
        }
      });
    }
  };

  // Toggle selection of a group
  const toggleGroupSelection = (groupId, isShiftKey = false) => {
    // Only clear existing selections if shift key is not pressed
    if (!isShiftKey) {
      // Clear path selections
      setSelectedPaths([]);
      
      // For single click (non-shift), toggle the selected group
      setSelectedGroups((prev) => {
        // If this is the only group selected and it's already selected, deselect it
        if (prev.includes(groupId) && prev.length === 1) {
          return [];
        } 
        // Otherwise, replace selection with just this group
        else {
          return [groupId];
        }
      });
    } else {
      // With shift key, add or remove from multi-selection
      setSelectedGroups((prev) => {
        if (prev.includes(groupId)) {
          return prev.filter((id) => id !== groupId);
        } else {
          return [...prev, groupId];
        }
      });
    }
  };

  // Group selected paths
  const groupSelectedPaths = () => {
    if (selectedPaths.length < 2 && selectedGroups.length === 0) return;

    addToHistory();

    // Create a new group
    const newGroupId = generateId("group");
    const newGroup = {
      id: newGroupId,
      name: `Group ${groups.length + 1}`,
      color: `hsl(${Math.random() * 360}, 60%, 60%)`,
    };

    // Update path groupIds
    setPaths((prev) =>
      prev.map((path) => {
        if (selectedPaths.includes(path.id) || (path.groupId && selectedGroups.includes(path.groupId))) {
          return {
            ...path,
            groupId: newGroupId,
          };
        }
        return path;
      })
    );

    // Add new group
    setGroups((prev) => [...prev, newGroup]);

    // Update selection to the new group
    setSelectedPaths([]);
    setSelectedGroups([newGroupId]);
  };

  // Ungroup selected group
  const ungroupSelectedGroup = (specificGroupIds = null) => {
    // If specific groups are provided, use those; otherwise use the selected groups
    const groupsToUngroup = specificGroupIds || selectedGroups;
    
    if (groupsToUngroup.length === 0) return;

    addToHistory();

    // Find all paths in the groups being ungrouped
    const pathsInGroups = paths.filter(path => 
      path.groupId && groupsToUngroup.includes(path.groupId)
    ).map(path => path.id);

    // Remove group assignments
    setPaths((prev) =>
      prev.map((path) => {
        if (path.groupId && groupsToUngroup.includes(path.groupId)) {
          return {
            ...path,
            groupId: null,
          };
        }
        return path;
      })
    );

    // Remove the groups
    setGroups((prev) => prev.filter((group) => !groupsToUngroup.includes(group.id)));

    // Clear group selection and select the newly ungrouped paths instead
    setSelectedGroups([]);
    setSelectedPaths(pathsInGroups);
  };

  // Convert a path between cubic and quadratic
  const togglePathType = (pathId) => {
    addToHistory();

    setPaths((prev) =>
      prev.map((path) => {
        if (path.id !== pathId) return path;

        // If it's cubic (has control2), convert to quadratic
        if (path.points.control2) {
          const { control2, ...restPoints } = path.points;
          return { ...path, points: restPoints };
        }
        // If it's quadratic (no control2), convert to cubic
        else {
          const controlX = path.points.control1.x;
          const controlY = path.points.control1.y;
          // Add a second control point
          return {
            ...path,
            points: {
              ...path.points,
              control2: {
                x: path.points.end.x - (path.points.control1.x - path.points.start.x),
                y: path.points.end.y - (path.points.control1.y - path.points.start.y),
              },
            },
          };
        }
      })
    );
  };

  // Get all paths in a group
  const getPathsInGroup = (groupId) => {
    return paths.filter((path) => path.groupId === groupId);
  };

  // Export the current paths as an SVG file
  const exportAsSVG = () => {
    // Create a new SVG element
    const svgContent = `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="${width}" 
      height="${height}" 
      viewBox="0 0 ${width} ${height}"
    >
      <!-- Full shape with fill -->
      <path 
        d="${fullPathString}" 
        fill="rgba(120, 200, 255, 0.13)" 
        stroke="#333" 
        stroke-width="2.5" 
        stroke-linejoin="round"
      />
      
      <!-- Individual paths -->
      ${paths.map(path => `
      <path 
        d="${getPathString(path)}" 
        fill="none" 
        stroke="${getPathColor(path)}" 
        stroke-width="2" 
        stroke-linejoin="round" 
      />
      `).join('')}
    </svg>
    `;
    
    // Create a blob from the SVG content
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bezier-paths.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  // Export SVG as JSON and save to server
  const exportAsJsonToServer = async () => {
    // Generate a name for the shape
    let shapeName = prompt("Enter a name for this shape:", "MyShape" + Math.floor(Math.random() * 1000));
    
    if (!shapeName) {
      return; // User cancelled the prompt
    }
    
    // Create SVG data
    const svgContent = `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="${width}" 
      height="${height}" 
      viewBox="0 0 ${width} ${height}"
    >
      <!-- Full shape with fill -->
      <path 
        d="${fullPathString}" 
        fill="rgba(120, 200, 255, 0.13)" 
        stroke="#333" 
        stroke-width="2.5" 
        stroke-linejoin="round"
      />
      
      <!-- Individual paths -->
      ${paths.map(path => `
      <path 
        d="${getPathString(path)}" 
        fill="none" 
        stroke="${getPathColor(path)}" 
        stroke-width="2" 
        stroke-linejoin="round" 
      />
      `).join('')}
    </svg>
    `;
    
    // Create the shape data to send to the server
    const shapeData = {
      name: shapeName,
      paths: JSON.parse(JSON.stringify(paths)), // Deep clone paths
      svgData: svgContent
    };
    
    try {
      // Send the shape data to the server
      const response = await fetch('http://localhost:5000/api/shapes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shapeData)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Shape saved successfully: ${result.message}`);
      } else {
        const errorData = await response.json();
        alert(`Error saving shape: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving shape to server:', error);
      alert(`Error saving shape: ${error.message}`);
    }
  };

  // Handle mouse down on control points
  const handleMouseDown = (pathId, pointKey) => (e) => {
    e.preventDefault();

    // Check if the path belongs to a selected group
    const path = paths.find((p) => p.id === pathId);
    if (path && path.groupId && selectedGroups.includes(path.groupId)) {
      // Start dragging the entire group
      setDraggingGroup({
        groupId: path.groupId,
        startX: e.clientX,
        startY: e.clientY,
        pathPoints: {}, // Will store original positions of all points in the group
      });

      // Store original positions of all points in all paths of the group
      const groupPaths = getPathsInGroup(path.groupId);
      const pathPoints = {};

      groupPaths.forEach((groupPath) => {
        pathPoints[groupPath.id] = { ...groupPath.points };
      });

      setDraggingGroup((prev) => ({
        ...prev,
        pathPoints,
      }));
    } else {
      // Regular point dragging
      setDraggingPoint({ pathId, pointKey });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setDraggingPoint(null);
    setDraggingGroup(null);
  };

  // Update connected points when moving
  const updateConnectedPoints = (pathId, pointKey, x, y) => {
    if (!pathConnectionMode) return;

    const connections = findConnections(pathId, pointKey);

    if (connections.length > 0) {
      setPaths((prev) =>
        prev.map((path) => {
          const connection = connections.find((conn) => conn.pathId === path.id);
          if (!connection) return path;

          return {
            ...path,
            points: {
              ...path.points,
              [connection.pointKey]: { x, y },
            },
          };
        })
      );
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    // Handle group dragging
    if (draggingGroup && !draggingPoint) {
      const { groupId, startX, startY, pathPoints } = draggingGroup;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Update all paths in the group
      setPaths((prev) =>
        prev.map((path) => {
          if (path.groupId !== groupId) return path;

          const origPoints = pathPoints[path.id];
          if (!origPoints) return path;

          // Create new points with the offset
          const newPoints = {};
          Object.entries(origPoints).forEach(([key, point]) => {
            newPoints[key] = {
              x: Math.max(0, Math.min(width, point.x + deltaX)),
              y: Math.max(0, Math.min(height, point.y + deltaY)),
            };
          });

          return {
            ...path,
            points: newPoints,
          };
        })
      );

      return;
    }

    // Handle individual point dragging
    if (!draggingPoint || !svgRef.current) return;

    const { pathId, pointKey } = draggingPoint;
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(width, e.clientX - svgRect.left));
    const y = Math.max(0, Math.min(height, e.clientY - svgRect.top));

    // Update the point position
    setPaths((prev) =>
      prev.map((path) => {
        if (path.id !== pathId) return path;

        return {
          ...path,
          points: {
            ...path.points,
            [pointKey]: { x, y },
          },
        };
      })
    );

    // Update connected points
    updateConnectedPoints(pathId, pointKey, x, y);
  };

  // Set up and clean up event listeners
  useEffect(() => {
    if (draggingPoint || draggingGroup) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingPoint, draggingGroup]);
  
  // Save paths to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bezierEditorPaths', JSON.stringify(paths));
    // Show save indicator
    setSaveIndicator(true);
    // Hide indicator after 1.5 seconds
    const timer = setTimeout(() => setSaveIndicator(false), 1500);
    return () => clearTimeout(timer);
  }, [paths]);

  // Save groups to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bezierEditorGroups', JSON.stringify(groups));
    // Show save indicator
    setSaveIndicator(true);
    // Hide indicator after 1.5 seconds
    const timer = setTimeout(() => setSaveIndicator(false), 1500);
    return () => clearTimeout(timer);
  }, [groups]);

  // Save keyframes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bezierEditorKeyframes', JSON.stringify(keyframes));
    // Show save indicator
    setSaveIndicator(true);
    // Hide indicator after 1.5 seconds
    const timer = setTimeout(() => setSaveIndicator(false), 1500);
    return () => clearTimeout(timer);
  }, [keyframes]);

  // Save loop animation setting to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('bezierEditorLoopSetting', JSON.stringify(loopAnimation));
    // Show save indicator
    setSaveIndicator(true);
    // Hide indicator after 1.5 seconds
    const timer = setTimeout(() => setSaveIndicator(false), 1500);
    return () => clearTimeout(timer);
  }, [loopAnimation]);

  // Initialize component
  useEffect(() => {
    // Clean up any animationFrame on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Load collections when in collection mode
  useEffect(() => {
    if (collectionMode) {
      const loadedCollections = getCollections();
      setCollections(loadedCollections);
    }
  }, [collectionMode]);

  // Handlers for showing path and control point coordinates
  const handleShowCoordinates = (pathId) => {
    const path = paths.find((p) => p.id === pathId);
    if (!path) return "";

    return Object.entries(path.points)
      .map(([key, point]) => `${key}: (${Math.round(point.x)}, ${Math.round(point.y)})`)
      .join(" | ");
  };

  // Collection management functions
  const createNewCollection = () => {
    // Validate input
    if (!collectionNameInput.trim()) {
      alert("Please provide a name for the collection");
      return;
    }
    
    // Create collection object
    const newCollection = {
      id: generateCollectionId(),
      name: collectionNameInput.trim(),
      description: collectionDescriptionInput.trim(),
      tags: collectionTagsInput.trim().split(',').map(tag => tag.trim()).filter(tag => tag),
      paths: JSON.parse(JSON.stringify(paths)),
      groups: JSON.parse(JSON.stringify(groups)),
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    const success = saveCollection(newCollection);
    
    if (success) {
      // Update local state
      setCollections(prev => [...prev, newCollection]);
      
      // Clear inputs
      setCollectionNameInput("");
      setCollectionDescriptionInput("");
      setCollectionTagsInput("");
      
      // Show save indicator
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 2000);
    } else {
      alert("Error saving collection. Please try again.");
    }
  };
  
  const deleteSelectedCollection = () => {
    if (!selectedCollectionId) return;
    
    if (window.confirm(`Are you sure you want to delete this collection?`)) {
      const success = deleteCollection(selectedCollectionId);
      
      if (success) {
        // Update local state
        setCollections(prev => prev.filter(c => c.id !== selectedCollectionId));
        setSelectedCollectionId(null);
        
        if (activeCollection && activeCollection.id === selectedCollectionId) {
          setActiveCollection(null);
        }
      } else {
        alert("Error deleting collection. Please try again.");
      }
    }
  };
  
  const loadCollectionForEditing = (collectionId) => {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      // Load paths and groups from collection
      setPaths(JSON.parse(JSON.stringify(collection.paths)));
      setGroups(JSON.parse(JSON.stringify(collection.groups || [])));
      
      // Update UI state
      setSelectedCollectionId(collectionId);
      setActiveCollection(collection);
      setCollectionNameInput(collection.name);
      setCollectionDescriptionInput(collection.description || '');
      setCollectionTagsInput((collection.tags || []).join(', '));
    }
  };
  
  const updateCurrentCollection = () => {
    if (!activeCollection) return;
    
    // Validate input
    if (!collectionNameInput.trim()) {
      alert("Please provide a name for the collection");
      return;
    }
    
    // Update collection object
    const updatedCollection = {
      ...activeCollection,
      name: collectionNameInput.trim(),
      description: collectionDescriptionInput.trim(),
      tags: collectionTagsInput.trim().split(',').map(tag => tag.trim()).filter(tag => tag),
      paths: JSON.parse(JSON.stringify(paths)),
      groups: JSON.parse(JSON.stringify(groups)),
      lastModified: new Date().toISOString()
    };
    
    // Save to localStorage
    const success = saveCollection(updatedCollection);
    
    if (success) {
      // Update local state
      setCollections(prev => prev.map(c => 
        c.id === updatedCollection.id ? updatedCollection : c
      ));
      setActiveCollection(updatedCollection);
      
      // Show save indicator
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 2000);
    } else {
      alert("Error updating collection. Please try again.");
    }
  };
  
  const instantiateCollection = (collectionId) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;
    
    // Create transformation object from current values
    const transformation = {
      translate: { x: transformValues.translateX, y: transformValues.translateY },
      scale: { x: transformValues.scaleX, y: transformValues.scaleY },
      rotate: transformValues.rotate,
      flipX: transformValues.flipX,
      flipY: transformValues.flipY
    };
    
    // Create a new transformed instance
    const transformedCollection = instantiateWithTransform(collection, transformation);
    
    // Save the new instance
    const success = saveCollection(transformedCollection);
    
    if (success) {
      // Update local state
      setCollections(prev => [...prev, transformedCollection]);
      setSelectedCollectionId(transformedCollection.id);
      
      // Show save indicator
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 2000);
      
      // Switch to the new collection
      loadCollectionForEditing(transformedCollection.id);
    } else {
      alert("Error creating transformed collection. Please try again.");
    }
  };
  
  const previewTransformation = () => {
    if (!selectedCollectionId) return;
    
    const collection = collections.find(c => c.id === selectedCollectionId);
    if (!collection) return;
    
    // Create transformation object from current values
    const transformation = {
      translate: { x: transformValues.translateX, y: transformValues.translateY },
      scale: { x: transformValues.scaleX, y: transformValues.scaleY },
      rotate: transformValues.rotate,
      flipX: transformValues.flipX,
      flipY: transformValues.flipY
    };
    
    // Apply transformation to paths without saving
    const transformedPaths = transformPaths(collection.paths, transformation);
    
    // Update UI to show transformed paths
    setPaths(transformedPaths);
  };
  
  const resetTransformValues = () => {
    setTransformValues({
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotate: 0,
      flipX: false,
      flipY: false
    });
  };

  // Generate SVG path string for a path
  const getPathString = (path) => {
    const { start, control1, control2, end } = path.points;

    if (control2) {
      // Cubic bezier
      return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
    } else {
      // Quadratic bezier
      return `M ${start.x} ${start.y} Q ${control1.x} ${control1.y}, ${end.x} ${end.y}`;
    }
  };

  // Get color for a path (group color overrides individual color if in a group)
  const getPathColor = (path) => {
    if (path.groupId) {
      const group = groups.find((g) => g.id === path.groupId);
      return group ? group.color : path.color;
    }
    return path.color;
  };

  // SVG path for the entire shape
  const fullPathString = paths.map((path) => getPathString(path)).join(" ");

  // Control point component
  const ControlPoint = ({ pathId, pointKey, position, color }) => {
    const isSelected = selectedPaths.includes(pathId) || (paths.find((p) => p.id === pathId)?.groupId && selectedGroups.includes(paths.find((p) => p.id === pathId)?.groupId));

    return (
      <g>
        <circle
          cx={position.x}
          cy={position.y}
          r={draggingPoint?.pathId === pathId && draggingPoint?.pointKey === pointKey ? 10 : 7}
          fill={pointKey === "start" || pointKey === "end" ? color : "#1a73e8"}
          stroke={
            isSelected ? "#ff9800" : draggingPoint?.pathId === pathId && draggingPoint?.pointKey === pointKey ? "#ff9800" : "#fff"
          }
          strokeWidth={isSelected || (draggingPoint?.pathId === pathId && draggingPoint?.pointKey === pointKey) ? 3 : 2}
          style={{ cursor: "move", transition: "r 0.1s, stroke 0.1s" }}
          onMouseDown={handleMouseDown(pathId, pointKey)}
        />
        <text
          x={position.x}
          y={position.y - 14}
          textAnchor="middle"
          fill="#333"
          fontSize="11px"
          fontWeight="bold"
          style={{ userSelect: "none" }}
        >
          {pointKey}
        </text>
      </g>
    );
  };

  // Control lines for a path
  const ControlLines = ({ path }) => {
    const { id, points } = path;
    const color = getPathColor(path);
    const { start, control1, control2, end } = points;

    return (
      <g>
        <line
          x1={start.x}
          y1={start.y}
          x2={control1.x}
          y2={control1.y}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        {control2 && (
          <line
            x1={end.x}
            y1={end.y}
            x2={control2.x}
            y2={control2.y}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        )}
      </g>
    );
  };

  // Path controls in the panel
  const PathControls = ({ path, isInGroup }) => {
    const isSelected = selectedPaths.includes(path.id);
    const color = getPathColor(path);

    return (
      <div
        onClick={(e) => {
          // Only toggle selection if the click wasn't on the checkbox or its label
          if (e.target.tagName !== 'INPUT' && 
              !e.target.closest('label[for^="checkbox-"]') &&
              e.target.tagName !== 'LABEL') {
            togglePathSelection(path.id, e.shiftKey);
          }
        }}
        style={{
          marginBottom: 12,
          padding: 10,
          border: `1px solid ${isSelected ? '#ff9800' : color}`,
          borderRadius: 4,
          background: isSelected ? `${color}20` : `${color}10`,
          opacity: isInGroup ? 0.9 : 1,
          marginLeft: isInGroup ? 20 : 0,
          cursor: 'pointer',
          boxShadow: isSelected ? '0 0 5px rgba(255,152,0,0.2)' : 'none',
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <label
              htmlFor={`checkbox-${path.id}`}
              style={{ 
                display: "flex",
                alignItems: "center", 
                cursor: "pointer",
                padding: "2px 0"
              }}
            >
              <input
                type="checkbox"
                id={`checkbox-${path.id}`}
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation(); // Prevent bubbling
                  togglePathSelection(path.id, e.shiftKey);
                }}
                style={{ 
                  marginRight: 8,
                  width: "16px",
                  height: "16px",
                  cursor: "pointer" 
                }}
              />
              <h4 style={{ color: color, margin: "0 0 0px", cursor: "pointer" }}>{path.name}</h4>
            </label>
            {path.groupId && (
              <span style={{ fontSize: 12, color: "#666" }}>
                ({groups.find((g) => g.id === path.groupId)?.name})
              </span>
            )}
          </div>
          <div>
            <button
              onClick={() => togglePathType(path.id)}
              style={{
                marginRight: 5,
                fontSize: 12,
                background: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: 3,
                padding: "2px 6px",
              }}
            >
              {path.points.control2 ? "→ Quad" : "→ Cubic"}
            </button>
            <button
              onClick={() => duplicatePath(path.id, false)}
              style={{
                marginRight: 5,
                fontSize: 12,
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: 3,
                padding: "2px 6px",
              }}
            >
              Duplicate
            </button>
            <button
              onClick={() => removePath(path.id)}
              style={{
                fontSize: 12,
                background: "#ff5555",
                color: "white",
                border: "none",
                borderRadius: 3,
                padding: "2px 6px",
              }}
            >
              Remove
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
          <div><b>Start:</b> ({Math.round(path.points.start.x)}, {Math.round(path.points.start.y)})</div>
          <div><b>Control 1:</b> ({Math.round(path.points.control1.x)}, {Math.round(path.points.control1.y)})</div>
          {path.points.control2 && (
            <div><b>Control 2:</b> ({Math.round(path.points.control2.x)}, {Math.round(path.points.control2.y)})</div>
          )}
          <div><b>End:</b> ({Math.round(path.points.end.x)}, {Math.round(path.points.end.y)})</div>
        </div>
      </div>
    );
  };

  // Group controls in the panel
  const GroupControls = ({ group }) => {
    const groupPaths = getPathsInGroup(group.id);
    const isSelected = selectedGroups.includes(group.id);

    if (groupPaths.length === 0) return null;

    return (
      <div
        onClick={(e) => {
          // Only toggle selection if the click wasn't on the checkbox or its label
          if (e.target.tagName !== 'INPUT' && 
              !e.target.closest('label[for^="checkbox-"]') &&
              e.target.tagName !== 'LABEL') {
            toggleGroupSelection(group.id, e.shiftKey);
          }
        }}
        style={{
          marginBottom: 16,
          padding: 12,
          border: `2px solid ${isSelected ? '#ff9800' : group.color}`,
          borderRadius: 6,
          background: isSelected ? `${group.color}20` : `${group.color}08`,
          cursor: 'pointer',
          boxShadow: isSelected ? '0 0 8px rgba(255,152,0,0.3)' : 'none',
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              htmlFor={`checkbox-group-${group.id}`}
              style={{ 
                display: "flex",
                alignItems: "center", 
                cursor: "pointer",
                padding: "2px 0"
              }}
            >
              <input
                type="checkbox"
                id={`checkbox-group-${group.id}`}
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation(); // Prevent the container click from being triggered
                  toggleGroupSelection(group.id, e.shiftKey);
                }}
                style={{ 
                  marginRight: 8,
                  width: "16px",
                  height: "16px",
                  cursor: "pointer" 
                }}
              />
              <h3 style={{ margin: 0, color: group.color, cursor: "pointer" }}>{group.name}</h3>
            </label>
            <span style={{ fontSize: 12, color: "#666" }}>({groupPaths.length} paths)</span>
          </div>
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent selection change
                duplicateGroup(group.id);
              }}
              style={{
                marginRight: 5,
                fontSize: 12,
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: 3,
                padding: "3px 8px",
              }}
            >
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent selection change
                ungroupSelectedGroup([group.id]);
              }}
              style={{
                fontSize: 12,
                background: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: 3,
                padding: "3px 8px",
              }}
            >
              Ungroup
            </button>
          </div>
        </div>

        {groupPaths.map((path) => (
          <PathControls key={path.id} path={path} isInGroup={true} />
        ))}
      </div>
    );
  };

  // Get selection summary
  const getSelectionSummary = () => {
    if (selectedPaths.length === 0 && selectedGroups.length === 0) {
      return { text: "Nothing selected", color: "#888" };
    }
    
    let parts = [];
    if (selectedPaths.length > 0) {
      parts.push(`${selectedPaths.length} path${selectedPaths.length !== 1 ? "s" : ""}`);
    }
    if (selectedGroups.length > 0) {
      parts.push(`${selectedGroups.length} group${selectedGroups.length !== 1 ? "s" : ""}`);
    }
    
    return {
      text: `Selected: ${parts.join(", ")}`,
      color: "#2980b9"
    };
  };

  // JSX structure
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f5f5f5", overflow: "hidden" }}>
      {/* Nav bar */}
      <div style={{ 
        height: 56, 
        background: "#222", 
        color: "#fff", 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center", 
        padding: "0 32px",
        fontSize: 22, 
        fontWeight: 600, 
        letterSpacing: 1, 
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)" 
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>Bezier Path Editor</span>
          {saveIndicator && (
            <span style={{
              fontSize: 12,
              background: "#4CAF50",
              color: "white",
              padding: "4px 8px",
              borderRadius: 4,
              marginLeft: 10,
              opacity: 0.8,
              animation: "fadeOut 1.5s ease-in-out"
            }}>
              Autosaved
            </span>
          )}
        </div>
        <div>
          <button
            onClick={() => setAnimationMode(!animationMode)}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: animationMode ? "#e74c3c" : "#555",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14
            }}
          >
            {animationMode ? "Animation Mode: ON" : "Animation Mode: OFF"}
          </button>
          
          <button
            onClick={() => setPathConnectionMode(!pathConnectionMode)}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: pathConnectionMode ? "#4CAF50" : "#555",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14
            }}
          >
            {pathConnectionMode ? "Auto-Connect: ON" : "Auto-Connect: OFF"}
          </button>
          
          <button
            onClick={() => groupSelectedPaths()}
            disabled={selectedPaths.length < 2 && selectedGroups.length === 0}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: selectedPaths.length >= 2 || selectedGroups.length > 0 ? "#9b59b6" : "#555",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14,
              opacity: selectedPaths.length >= 2 || selectedGroups.length > 0 ? 1 : 0.5
            }}
          >
            Group Selected
          </button>
          
          <button
            onClick={() => ungroupSelectedGroup()}
            disabled={selectedGroups.length === 0}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: selectedGroups.length > 0 ? "#e67e22" : "#555",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14,
              opacity: selectedGroups.length > 0 ? 1 : 0.5
            }}
          >
            Ungroup
          </button>

          <button
            onClick={() => {
              if (selectedPaths.length > 0) {
                // Duplicate all selected paths and select the new ones
                const newPathIds = [];
                
                // First duplicate all paths but keep the original selection for now
                selectedPaths.forEach(pathId => {
                  const newPathId = duplicatePath(pathId, true); // true to keep existing selection
                  if (newPathId) newPathIds.push(newPathId);
                });
                
                // Then update the selection to the newly created paths
                setSelectedPaths(newPathIds);
                setSelectedGroups([]);
              } else if (selectedGroups.length > 0) {
                selectedGroups.forEach(groupId => duplicateGroup(groupId));
              }
            }}
            disabled={selectedPaths.length === 0 && selectedGroups.length === 0}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: (selectedPaths.length > 0 || selectedGroups.length > 0) ? "#2980b9" : "#555",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14,
              opacity: (selectedPaths.length > 0 || selectedGroups.length > 0) ? 1 : 0.5
            }}
          >
            Duplicate Selected
          </button>
          
          <button
            onClick={handleUndo}
            disabled={pathHistory.length === 0}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: pathHistory.length > 0 ? "#f39c12" : "#555",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14,
              opacity: pathHistory.length > 0 ? 1 : 0.5
            }}
          >
            Undo
          </button>
          
          <button
            onClick={exportAsSVG}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: "#3498db",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14
            }}
          >
            Export as SVG
          </button>

          <button
            onClick={exportAsJsonToServer}
            style={{
              marginRight: 12,
              padding: "6px 12px",
              background: "#16a085",
              border: "none",
              color: "white",
              borderRadius: 4,
              fontSize: 14
            }}
          >
            Save to Server
          </button>
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "row", height: `calc(100vh - 56px)` }}>
        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, margin: 24, flex: 1, minWidth: 0 }}
        >
          {/* Background grid */}
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e0e0e0" strokeWidth="1" />
          </pattern>
          <rect width={width} height={height} fill="url(#grid)" />
          
          {/* Control lines */}
          {paths.map((path) => (
            <ControlLines key={`control-${path.id}`} path={path} />
          ))}
          
          {/* Full closed path */}
          <path
            d={fullPathString}
            fill="rgba(120, 200, 255, 0.13)"
            stroke="#333"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          
          {/* Individual paths with their own colors */}
          {paths.map((path) => (
            <path
              key={`path-${path.id}`}
              d={getPathString(path)}
              fill="none"
              stroke={getPathColor(path)}
              strokeWidth={selectedPaths.includes(path.id) ? "3.5" : "2"}
              strokeLinejoin="round"
              onClick={(e) => togglePathSelection(path.id, e.shiftKey)}
              style={{ 
                cursor: 'pointer',
                strokeDasharray: selectedPaths.includes(path.id) ? "none" : "none",
                filter: selectedPaths.includes(path.id) ? "drop-shadow(0 0 3px rgba(255,165,0,0.5))" : "none"
              }}
            />
          ))}
          
          {/* Control points */}
          {paths.map((path) => (
            <React.Fragment key={`points-${path.id}`}>
              {Object.entries(path.points).map(([pointKey, position]) => (
                <ControlPoint
                  key={`point-${path.id}-${pointKey}`}
                  pathId={path.id}
                  pointKey={pointKey}
                  position={position}
                  color={getPathColor(path)}
                />
              ))}
            </React.Fragment>
          ))}
        </svg>
        
        {/* Info panel */}
        <div style={{ width: 340, background: "#fafbfc", borderLeft: "1px solid #eee", padding: 24, overflowY: "auto" }}>
          <h3 style={{ marginTop: 0 }}>Bezier Path Editor</h3>
          
          <div style={{ fontSize: 14, marginBottom: 20 }}>
            <p>
              <strong>Tips:</strong>
              <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                <li>Select paths by clicking the checkboxes or anywhere on the path card</li>
                <li><strong>Hold Shift</strong> to select multiple paths at once</li>
                <li>Group 2+ selected paths to move them together</li>
                <li>Click controls to reshape the curves</li>
                <li>Toggle auto-connect to link endpoints</li>
                <li>Duplicate paths or groups to create variations</li>
                <li>Your work is <strong>automatically saved</strong> between sessions</li>
                <li>Use the <strong>Reset</strong> button to start over</li>
                <li>Create <strong>keyframes</strong> to animate your paths</li>
              </ul>
            </p>
          </div>
          
          {/* Animation Panel */}
          <div style={{
            marginBottom: 20,
            padding: 12,
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: 4,
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 10 
            }}>
              <h4 style={{ margin: 0 }}>Animation Timeline</h4>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={animationMode}
                  onChange={() => setAnimationMode(!animationMode)}
                  style={{ marginRight: 6 }}
                />
                <span>Animation Mode</span>
              </label>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ position: 'relative', width: '100%', height: 20, marginBottom: 4 }}>
                {/* Keyframe markers */}
                {keyframes.map((kf, index) => (
                  <div 
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${(kf.frame / totalFrames) * 100}%`,
                      top: 0,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: kf.frame === currentFrame ? '#ff9800' : '#3498db',
                      transform: 'translateX(-50%)',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                    onClick={() => setCurrentFrame(kf.frame)}
                    title={`Keyframe at frame ${kf.frame}`}
                  />
                ))}
                
                {/* Timeline track */}
                <div style={{ 
                  position: 'absolute',
                  top: 4,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: '#ddd',
                  zIndex: 1
                }}/>
              </div>
              
              <input
                type="range"
                min="0"
                max={totalFrames}
                value={currentFrame}
                onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                style={{ width: '100%', marginBottom: 8 }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>Frame: {currentFrame} of {totalFrames}</span>
                <span>{hasKeyframeAtCurrentFrame() ? '● Keyframe' : ''}</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <button 
                onClick={createKeyframe} 
                style={{
                  padding: '6px 8px',
                  background: '#3498db',
                  border: 'none',
                  borderRadius: 3,
                  color: 'white',
                  fontSize: 12
                }}
              >
                {hasKeyframeAtCurrentFrame() ? 'Update Keyframe' : 'Add Keyframe'}
              </button>
              
              <button 
                onClick={deleteKeyframe}
                disabled={!hasKeyframeAtCurrentFrame()}
                style={{
                  padding: '6px 8px',
                  background: hasKeyframeAtCurrentFrame() ? '#e74c3c' : '#555',
                  border: 'none',
                  borderRadius: 3,
                  color: 'white',
                  fontSize: 12,
                  opacity: hasKeyframeAtCurrentFrame() ? 1 : 0.5
                }}
              >
                Delete Keyframe
              </button>
              
              <button 
                onClick={isPlaying ? stopPlayback : startPlayback}
                style={{
                  padding: '6px 8px',
                  background: '#27ae60',
                  border: 'none',
                  borderRadius: 3,
                  color: 'white',
                  fontSize: 12
                }}
              >
                {isPlaying ? 'Stop' : 'Play'} 
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 8 }}>
              {/* Frame navigation */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setCurrentFrame(Math.max(0, currentFrame - 10))}
                  style={{
                    padding: '3px 6px',
                    background: '#6c757d',
                    border: 'none',
                    borderRadius: 3,
                    color: 'white',
                    fontSize: 12
                  }}
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
                  style={{
                    padding: '3px 6px',
                    background: '#6c757d',
                    border: 'none',
                    borderRadius: 3,
                    color: 'white',
                    fontSize: 12
                  }}
                >
                  ‹
                </button>
              </div>
              
              {/* Keyframe navigation */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => {
                    // Go to previous keyframe
                    const prevFrames = keyframes
                      .filter(kf => kf.frame < currentFrame)
                      .map(kf => kf.frame);
                    
                    if (prevFrames.length > 0) {
                      setCurrentFrame(Math.max(...prevFrames));
                    }
                  }}
                  disabled={!keyframes.some(kf => kf.frame < currentFrame)}
                  style={{
                    padding: '3px 6px',
                    background: keyframes.some(kf => kf.frame < currentFrame) ? '#3498db' : '#555',
                    border: 'none',
                    borderRadius: 3,
                    color: 'white',
                    fontSize: 12,
                    opacity: keyframes.some(kf => kf.frame < currentFrame) ? 1 : 0.5
                  }}
                >
                  ⬅ Key
                </button>
                <button
                  onClick={() => {
                    // Go to next keyframe
                    const nextFrames = keyframes
                      .filter(kf => kf.frame > currentFrame)
                      .map(kf => kf.frame);
                    
                    if (nextFrames.length > 0) {
                      setCurrentFrame(Math.min(...nextFrames));
                    }
                  }}
                  disabled={!keyframes.some(kf => kf.frame > currentFrame)}
                  style={{
                    padding: '3px 6px',
                    background: keyframes.some(kf => kf.frame > currentFrame) ? '#3498db' : '#555',
                    border: 'none',
                    borderRadius: 3,
                    color: 'white',
                    fontSize: 12,
                    opacity: keyframes.some(kf => kf.frame > currentFrame) ? 1 : 0.5
                  }}
                >
                  Key ➡
                </button>
              </div>
              
              {/* Frame navigation */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 1))}
                  style={{
                    padding: '3px 6px',
                    background: '#6c757d',
                    border: 'none',
                    borderRadius: 3,
                    color: 'white',
                    fontSize: 12
                  }}
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 10))}
                  style={{
                    padding: '3px 6px',
                    background: '#6c757d',
                    border: 'none',
                    borderRadius: 3,
                    color: 'white',
                    fontSize: 12
                  }}
                >
                  »
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Total Frames:
                <input 
                  type="number" 
                  min="10" 
                  max="300" 
                  value={totalFrames} 
                  onChange={(e) => setTotalFrames(parseInt(e.target.value))}
                  style={{ marginLeft: 8, width: 60 }}
                />
              </label>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, display: 'block' }}>
                  Speed:
                  <select 
                    value={playbackSpeed} 
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    style={{ marginLeft: 8 }}
                  >
                    <option value="0.25">0.25x</option>
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                  </select>
                </label>
                
                <label style={{ 
                  fontSize: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  marginLeft: 12
                }}>
                  <input 
                    type="checkbox" 
                    checked={loopAnimation} 
                    onChange={() => setLoopAnimation(!loopAnimation)}
                    style={{ marginRight: 6 }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Loop Animation
                    {loopAnimation && (
                      <span style={{ 
                        marginLeft: 4,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: '#4CAF50',
                        display: 'inline-block'
                      }} title="Animation will loop when it reaches the end"/>
                    )}
                  </span>
                </label>
              </div>
            </div>
            
            {keyframes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: '8px 0', fontSize: 12 }}>
                  <strong>Keyframes:</strong> {keyframes.map(kf => kf.frame).join(', ')}
                </p>
              </div>
            )}
          </div>
          
          {/* Selection summary */}
          {(selectedPaths.length > 0 || selectedGroups.length > 0) && (
            <div style={{
              padding: "8px 12px",
              marginBottom: 20,
              backgroundColor: "#f0f8ff",
              border: "1px solid #cce5ff",
              borderRadius: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ 
                fontWeight: "bold", 
                color: getSelectionSummary().color 
              }}>
                {getSelectionSummary().text}
              </div>
              <button
                onClick={() => {
                  setSelectedPaths([]);
                  setSelectedGroups([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            </div>
          )}
          
          {/* Groups section */}
          {groups.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: "0 0 10px" }}>Groups ({groups.length})</h4>
              {groups.map((group) => (
                <GroupControls key={`group-${group.id}`} group={group} />
              ))}
            </div>
          )}
          
          {/* Ungrouped paths section */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Paths ({paths.filter((p) => !p.groupId).length})</h4>
            <button
              onClick={addPath}
              style={{
                padding: "4px 10px",
                background: "#3498db",
                border: "none",
                color: "white",
                borderRadius: 4,
                fontSize: 13
              }}
            >
              + Add Path
            </button>
          </div>
          
          {paths.filter((p) => !p.groupId).map((path) => (
            <PathControls key={`controls-${path.id}`} path={path} isInGroup={false} />
          ))}
          
          <details style={{ marginTop: 18 }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>SVG Path</summary>
            <pre style={{ 
              background: "#f7f7f7", 
              padding: 10, 
              borderRadius: 4, 
              fontSize: 12, 
              overflow: "auto" 
            }}>
              {fullPathString}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
