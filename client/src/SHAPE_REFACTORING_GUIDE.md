# Shape Component Refactoring Guide

## Overview
The Shape component and its related utilities have been refactored into multiple files to improve maintainability. This document explains the new structure and how to use the refactored code.

## Directory Structure
```
client/src/
├── components/
│   ├── Shape.js         # Main Shape React component 
│   └── ShapeData.js     # Example shape data
├── utils/
│   └── shape/           # Shape utility functions
│       ├── index.js           # Barrel file that exports all utils
│       ├── animationUtils.js  # Animation calculation functions
│       ├── domUtils.js        # DOM manipulation functions
│       ├── pathUtils.js       # SVG path generation functions
│       └── shapeHelpers.js    # Helper functions for the Shape component
```

## Utility Functions

### Animation Utilities (animationUtils.js)
- `evaluateExpression(expression, variables)` - Safely evaluates mathematical expressions
- `calculateFormula(formula, currentTime, duration)` - Calculates values based on mathematical formulas
- `calculateControlPointPosition(pointId, animation, currentTime, duration, controlPoints)` - Calculates animated position for control points
- `calculateGlobalPosition(animation, currentTime)` - Calculates the animated global position

### DOM Utilities (domUtils.js)
- `deepEquals(obj1, obj2)` - Deep equality comparison for objects
- `updateAffectedSegments(affectedSegments, shapeData, controlPoints, position, segmentRefs, containerRef)` - Updates SVG path elements affected by animation
- `calculateViewBox(svgPosition, width, height)` - Calculates the SVG viewBox for the shape

### Path Utilities (pathUtils.js)
- `generateLinePathData(start, end, isFirstSegment)` - Generates SVG path data for a line segment
- `generateBezierPathData(start, control1, control2, end, isFirstSegment)` - Generates SVG path data for a cubic bezier curve segment
- `generateCombinedPathData(segments, findPoint, transformPoint, closePath)` - Generates a complete SVG path from multiple segments

### Shape Helpers (shapeHelpers.js)
- `updateAnimationValues(...)` - Updates animation values based on current time

## Using the Refactored Code

### Basic Usage
```jsx
import { Shape } from './components/Shape';
import { exampleShapeData } from './components/ShapeData';

function App() {
  return (
    <div className="App">
      <Shape shapeData={exampleShapeData} />
    </div>
  );
}
```

### Creating Custom Shapes
To create a custom shape, follow the structure in `ShapeData.js`. The shape data consists of:
- `controlPoints`: Array of points with coordinates
- `segments`: Array of lines or bezier curves that connect the points
- `animations`: Optional animations for control points and position
- `fillPath` & `closePath`: Configuration for the combined fill path

### Adding New Utilities
To add new utility functions:
1. Add the function to the appropriate file in `utils/shape/`
2. Export it from that file
3. If needed, add it to the barrel exports in `index.js`
4. Import it where needed

## Benefits of the Refactored Structure
- **Improved maintainability**: Each utility has a single responsibility
- **Better code organization**: Related functions are grouped together
- **Easier testing**: Utilities can be tested independently
- **Reusability**: Functions can be used in other components
