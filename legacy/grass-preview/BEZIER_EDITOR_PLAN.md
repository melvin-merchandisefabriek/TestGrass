# Bezier Path Editor - Feature Overview

## Core Features
The Bezier Path Editor is an interactive SVG-based tool built in React that allows users to create, edit, and visualize Bezier curves. The editor provides a robust set of features for path manipulation and management.

### Interactive Canvas
- Full-width SVG canvas with responsive design
- Background grid for better visual reference
- Navigation bar with controls for core functionality
- Sidebar panel displaying path details and controls

### Path Management
- **Multi-Path Support**: Create and manage multiple Bezier paths
- **Path Types**: Support for both cubic (3-point) and quadratic (2-point) Bezier curves 
- **Path Colors**: Each path has its own distinct color for easy identification
- **Add/Remove Paths**: Add new paths or remove existing ones with a single click
- **Path Selection**: Click on paths or checkboxes to select them for editing or grouping
- **Path Grouping**: Organize multiple paths into groups for easier manipulation
- **Path Hierarchy**: Groups maintain visual hierarchy in the sidebar interface
- **Path Duplication**: Easily duplicate individual paths or entire groups with proper offsetting
- **Path Data Structure**: Path points stored in an organized data structure with:
  ```javascript
  {
    id: "unique-path-id",
    name: "Path Name",
    color: "#hexcolor",
    groupId: "group-id-or-null",
    points: {
      start: { x: 400, y: 100 },
      control1: { x: 350, y: 200 },
      control2: { x: 250, y: 250 }, // Optional for cubic curves
      end: { x: 200, y: 300 }
    }
  }
  ```

### Group Operations
- **Create Groups**: Select multiple paths and group them with one click
- **Group Movement**: Move entire groups of paths together by dragging any point
- **Group Visual Style**: Groups share the same color to visually indicate relationship
- **Ungroup**: Break a group back into individual paths
- **Group Selection**: Toggle selection of entire groups with a single action
- **Group Duplication**: Duplicate entire groups including all member paths
- **Group Structure**: Organized representation of group relationships:
  ```javascript
  {
    id: "group-id",
    name: "Group Name",
    color: "#groupcolor"
  }
  ```

### Point Manipulation
- **Draggable Control Points**: All points can be dragged with mouse interactions
- **Visual Feedback**: Points change size and color when being dragged
- **Coordinate Constraints**: Points are automatically constrained within the canvas boundaries
- **Auto-Connect Mode**: Optional feature that automatically connects endpoints between different paths
- **Connection Detection**: Intelligently finds and maintains connections between paths
- **Point Types**: Different visual styling for endpoints vs. control points

### Interactive Features
- **Undo Functionality**: Revert to previous state with an undo button
- **Path Type Toggle**: Convert between cubic and quadratic Bezier curves
- **Real-time Path Generation**: SVG paths update instantly as points are moved
- **Path Information Display**: Coordinates shown in the sidebar for all control points
- **Multi-Select System**: Select multiple paths with Shift+Click for batch operations
- **Batch Operations**: Apply actions like duplicating to multiple selected paths or groups
- **Visual Selection Feedback**: Selected paths and groups are highlighted with distinctive styling
- **Selection Summary**: Dynamic display showing currently selected items with quick clear option
- **Group Manipulation**: Drag any point in a group to move the entire group
- **SVG Export**: Export paths as an SVG file for use in other applications

### Animation System
- **Keyframe-Based Animation**: Create keyframes at specific frames to define path positions
- **Timeline Interface**: Slider control to scrub through animation frames
- **Keyframe Interpolation**: Smooth transitions between defined keyframes
- **Animation Controls**: Play, stop, and navigate between keyframes
- **Frame Navigation**: Easily navigate through the timeline one frame at a time
- **Playback Speed Control**: Adjust the speed of animation playback
- **Animation Mode Toggle**: Switch between editing and animation modes
- **Visual Keyframe Markers**: See keyframes on the timeline for easy navigation

## Technical Implementation Details

### Event Handling
- Mouse events properly captured and handled with React's event system
- Global event handlers for smoother drag operations
- Proper cleanup of event listeners to prevent memory leaks
- Event delegation for efficient performance
- Group movement tracking for unified manipulation

### SVG Path Generation
```javascript
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
```

### Group Management System
```javascript
// Group selected paths
const groupSelectedPaths = () => {
  if (selectedPaths.length < 2 && selectedGroups.length === 0) return;
  
  addToHistory();
  
  // Create a new group
  const newGroupId = generateId("group");
  const newGroup = {
    id: newGroupId,
    name: `Group ${groups.length + 1}`,
    color: `hsl(${Math.random() * 360}, 60%, 60%)`
  };
  
  // Update path groupIds
  setPaths(prev => prev.map(path => {
    if (selectedPaths.includes(path.id) || 
        (path.groupId && selectedGroups.includes(path.groupId))) {
      return {
        ...path,
        groupId: newGroupId
      };
    }
    return path;
  }));
  
  // Add new group
  setGroups(prev => [...prev, newGroup]);
  
  // Update selection to the new group
  setSelectedPaths([]);
  setSelectedGroups([newGroupId]);
};
```

### Group Drag System
```javascript
// Handle group dragging
if (draggingGroup && !draggingPoint) {
  const { groupId, startX, startY, pathPoints } = draggingGroup;
  
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;
  
  // Update all paths in the group
  setPaths(prev => prev.map(path => {
    if (path.groupId !== groupId) return path;
    
    const origPoints = pathPoints[path.id];
    if (!origPoints) return path;
    
    // Create new points with the offset
    const newPoints = {};
    Object.entries(origPoints).forEach(([key, point]) => {
      newPoints[key] = {
        x: Math.max(0, Math.min(width, point.x + deltaX)),
        y: Math.max(0, Math.min(height, point.y + deltaY))
      };
    });
    
    return {
      ...path,
      points: newPoints
    };
  }));
}
```

### Path Duplication System
```javascript
// Duplicate a path
const duplicatePath = (pathId) => {
  addToHistory();
  
  // Find the path to duplicate
  const originalPath = paths.find((p) => p.id === pathId);
  if (!originalPath) return;
  
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
  
  // Select the new path
  setSelectedPaths([newPath.id]);
  setSelectedGroups([]);
};
```

### SVG Export System
```javascript
// Export the current paths as an SVG file
const exportAsSVG = () => {
  // Create a new SVG element with all paths
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
  
  // Create a download link for the SVG file
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bezier-paths.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

### Visual Components

#### Control Point Component
```javascript
const ControlPoint = ({ pathId, pointKey, position, color }) => {
  const isSelected = selectedPaths.includes(pathId) || 
    (paths.find(p => p.id === pathId)?.groupId && 
     selectedGroups.includes(paths.find(p => p.id === pathId)?.groupId));
     
  return (
    <g>
      <circle
        cx={position.x}
        cy={position.y}
        r={draggingPoint?.pathId === pathId && draggingPoint?.pointKey === pointKey ? 10 : 7}
        fill={pointKey === "start" || pointKey === "end" ? color : "#1a73e8"}
        stroke={
          isSelected ? "#ff9800" : 
          draggingPoint?.pathId === pathId && draggingPoint?.pointKey === pointKey ? "#ff9800" : "#fff"
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
```

#### Group Controls Component
```javascript
const GroupControls = ({ group }) => {
  const groupPaths = getPathsInGroup(group.id);
  const isSelected = selectedGroups.includes(group.id);
  
  return (
    <div style={{
      marginBottom: 16,
      padding: 12,
      border: `2px solid ${group.color}`,
      borderRadius: 6,
      background: `${group.color}08`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleGroupSelection(group.id)}
          />
          <h3 style={{ margin: 0, color: group.color }}>{group.name}</h3>
          <span style={{ fontSize: 12, color: '#666' }}>({groupPaths.length} paths)</span>
        </div>
        <button
          onClick={() => ungroupSelectedGroup([group.id])}
          style={{
            fontSize: 12,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: 3,
            padding: '3px 8px'
          }}
        >
          Ungroup
        </button>
      </div>
      
      {/* Child paths within this group */}
      {groupPaths.map(path => (
        <PathControls key={path.id} path={path} isInGroup={true} />
      ))}
    </div>
  );
};
```

## User Interface Elements

### Interactive Controls
- Group/ungroup buttons for organizing paths
- Add/remove paths with dedicated buttons
- Toggle path types between cubic and quadratic
- Undo button for reverting changes
- Auto-connect toggle for connecting path endpoints

### Information Panel
- Hierarchical display of groups and paths
- Group-based organization of related paths
- Individual path controls within groups
- Display of all paths with their control point coordinates
- Real-time updates of point positions during dragging
- Visual distinction between path types
- SVG path data export for use in other applications

## Implemented Features
- Multi-path Bezier curve editing
- Cubic and quadratic curve support
- Group management system
- Multi-selection functionality
- Visual feedback for selections
- Path duplication functionality
- Group duplication capability
- Autosave functionality with localStorage
- Visual autosave indication
- Animation system with keyframes
- Timeline-based animation controls
- Keyframe interpolation for smooth transitions

## Future Enhancements
- More comprehensive redo functionality
- Path transformation tools (rotate, scale, etc.)
- Importing SVG paths from external sources
- Custom color picker for paths and groups
- Keyboard shortcuts for common operations
- Path alignment tools
