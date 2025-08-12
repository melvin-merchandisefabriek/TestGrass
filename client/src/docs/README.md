# TestGrass Client Structure Documentation

This document describes the reorganized codebase structure that separates WebGL and SVG technologies for better maintainability.

## Folder Structure

```
src/
├── webgl/             # All WebGL-related code
│   ├── components/    # WebGL React components
│   │   ├── AnimatedWebGLTriangle.js
│   │   ├── BezierCurveWebGL.js
│   │   ├── BezierShapeWebGL.js
│   │   ├── BladeGPUAnimated.js
│   │   ├── GrassBladeWebGLDemo.js
│   │   ├── GrassFieldWebGL.js
│   │   ├── MultiBezierWebGL.js
│   │   ├── ShapeWebGLDemo.js
│   │   ├── SimpleWebGLTriangle.js
│   │   └── UnifiedWebGLScene.js
│   ├── utils/         # WebGL utility functions
│   │   ├── GrassChunkManager.js
│   │   ├── grassShader.js
│   │   └── noise.js
│   └── examples/      # WebGL example implementations
│       └── BezierShapeDemo.js
│
├── svg/               # All SVG-related code
│   ├── components/    # SVG React components
│   │   └── UnifiedSceneSVG.js
│   ├── utils/         # SVG utility functions (currently empty)
│   └── examples/      # SVG examples (currently empty)
│
├── shared/            # Code shared between WebGL and SVG
│   ├── utils/         # Common utility functions
│   │   ├── animationUtils.js    # Animation calculations
│   │   ├── dataUtils.js         # Data manipulation utilities
│   │   ├── displayUtils.js      # Display-related utilities
│   │   ├── domUtils.js          # DOM manipulation utilities
│   │   ├── earclip.js           # Triangulation algorithm
│   │   ├── index.js             # Barrel export file
│   │   ├── modificationUtils.js # Shape modification utilities
│   │   ├── pathUtils.js         # Path calculation utilities
│   │   ├── shapeHelpers.js      # Shape manipulation helpers
│   │   └── variableUtils.js     # Variable substitution utilities
│   ├── models/        # Shared data models (currently empty)
│   └── constants/     # Shared constants (currently empty)
│
├── core/              # Core application logic
│   ├── services/      # Business logic services
│   │   ├── AddShapeForm.js
│   │   ├── AnimationRef.js
│   │   ├── Environment.js
│   │   ├── Grass.js
│   │   ├── GrassBlade.js
│   │   ├── Ground.js
│   │   ├── MenuButton.js
│   │   ├── MinimalDot.js
│   │   ├── Player.js
│   │   ├── Shape.js
│   │   ├── SharedAnimatedTriangles.js
│   │   ├── SharedAnimatedTrianglesConfigEditor.js
│   │   ├── SharedAnimatedTrianglesDefs.js
│   │   ├── TriangleArray.js
│   │   └── UI.js
│   └── helpers/       # Helper functions (currently empty)
│
├── assets/            # Static assets
│   ├── bladeConfig.json         # Configuration file
│   ├── groundShape.json         # Shape data
│   ├── images/                  # Image files (currently empty)
│   ├── fonts/                   # Font files (currently empty)
│   └── styles/                  # CSS/SCSS files
│       ├── App.css
│       └── index.css
│
├── docs/              # Documentation
│   └── README.md                # This file
│
├── App.js             # Main application component
└── index.js           # Application entry point
```

## Technology Separation

### WebGL Components
The `webgl/` directory contains all WebGL-related React components that use the WebGL rendering context for GPU-accelerated graphics:

- **Triangle Components**: Basic WebGL triangle demos (Animated, Simple)
- **Bezier Components**: Bezier curve rendering using WebGL
- **Grass Components**: Grass blade and field rendering with GPU animation
- **Scene Components**: Complex unified WebGL scenes

### SVG Components
The `svg/` directory contains SVG-based components that use scalable vector graphics:

- **UnifiedSceneSVG**: Main SVG scene implementation

### Shared Utilities
The `shared/` directory contains utilities used by both WebGL and SVG components:

- **Animation Utils**: Time-based animation calculations
- **Shape Utils**: Shape manipulation and calculation functions
- **Data Utils**: Data transformation and management
- **DOM Utils**: DOM manipulation helpers

### Core Services
The `core/` directory contains the main application logic and business services:

- **Shape**: Main shape rendering and interaction component
- **Environment**: Application environment setup
- **UI Components**: User interface elements
- **Animation Services**: Animation management and configuration

## Import Guidelines

When importing from the reorganized structure, use the following patterns:

```javascript
// WebGL components
import SomeWebGLComponent from '../webgl/components/SomeWebGLComponent';

// SVG components  
import SomeSVGComponent from '../svg/components/SomeSVGComponent';

// Shared utilities
import { someUtility } from '../shared/utils';

// Core services
import SomeService from '../core/services/SomeService';

// Assets
import config from '../assets/config.json';
import '../assets/styles/Component.css';
```

## Benefits of This Structure

1. **Clear Separation of Concerns**: WebGL and SVG code are clearly separated
2. **Technology-Specific Organization**: Each rendering technology has its own space
3. **Shared Code Reuse**: Common utilities are properly shared between technologies
4. **Scalability**: Easy to add new components in the appropriate technology folder
5. **Maintainability**: Clearer understanding of component responsibilities
6. **Development Efficiency**: Easier to locate and modify specific functionality

## Migration Notes

- All import paths have been updated to reflect the new structure
- Existing functionality remains unchanged
- The application builds and runs successfully with the new organization
- Linting warnings are pre-existing and not related to the reorganization