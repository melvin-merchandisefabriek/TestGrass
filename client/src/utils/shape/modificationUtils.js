/**
 * Utility functions for handling shape modifications from external sources
 */

/**
 * Applies modifications from a modifications object to a shape
 * @param {Object} shape - The original shape object
 * @param {Object} modifications - Modification specifications
 * @returns {Object} Modified shape object
 */
export const applyShapeModifications = (shape, modifications) => {
  if (!shape || !modifications) return shape;
  
  // Create a deep copy to avoid mutating the original
  const modifiedShape = JSON.parse(JSON.stringify(shape));
  
  // Apply position modifications
  if (modifications.modifyPosition) {
    // Support svg and global keys for unified SVG logic
    if (modifications.modifyPosition.svg) {
      if (!modifiedShape.position) modifiedShape.position = {};
      modifiedShape.position.svg = { ...modifications.modifyPosition.svg };
    }
    if (modifications.modifyPosition.global) {
      if (!modifiedShape.position) modifiedShape.position = {};
      modifiedShape.position.global = { ...modifications.modifyPosition.global };
    }
    // Legacy: if x/y provided at top level, apply to global
    if (typeof modifications.modifyPosition.x === 'number' || typeof modifications.modifyPosition.y === 'number') {
      if (modifiedShape.position?.global) {
        modifiedShape.position.global.x += modifications.modifyPosition.x || 0;
        modifiedShape.position.global.y += modifications.modifyPosition.y || 0;
      }
    }
  }
  
  // Apply control point modifications
  if (modifications.modifyControlPoints) {
    Object.entries(modifications.modifyControlPoints).forEach(([pointId, changes]) => {
      const controlPoint = modifiedShape.controlPoints.find(point => point.id === pointId);
      if (controlPoint) {
        if (changes.xOffset) controlPoint.x += changes.xOffset;
        if (changes.yOffset) controlPoint.y += changes.yOffset;
      }
    });
  }
  
  // Apply style modifications
  if (modifications.styleChanges) {
    Object.entries(modifications.styleChanges).forEach(([segmentId, newStyle]) => {
      const segment = modifiedShape.segments.find(seg => seg.id === segmentId);
      if (segment) {
        segment.style = { ...segment.style, ...newStyle };
      }
    });
  }
  
  // Apply main style from modifications if present
  if (modifications.style) {
    modifiedShape.style = { ...modifiedShape.style, ...modifications.style };
  }
  
  // Apply fillPath and closePath from modifications if present
  if (typeof modifications.fillPath !== 'undefined') {
    modifiedShape.fillPath = modifications.fillPath;
  }
  
  if (typeof modifications.closePath !== 'undefined') {
    modifiedShape.closePath = modifications.closePath;
  }
  
  // Copy viewBox if present in modifications
  if (modifications.viewBox) {
    modifiedShape.viewBox = modifications.viewBox;
  }
  
  // Copy width and height if present in modifications
  if (typeof modifications.width !== 'undefined') {
    modifiedShape.width = modifications.width;
  }
  
  if (typeof modifications.height !== 'undefined') {
    modifiedShape.height = modifications.height;
  }
  
  // Apply display options from modifications if present
  if (modifications.displayOptions) {
    modifiedShape.displayOptions = {
      ...modifiedShape.displayOptions || {},
      ...modifications.displayOptions
    };
  }
  
  // --- Merge or preserve variables field ---
  if (shape.variables || modifications.variables) {
    // Support both array and object forms
    let baseVars = shape.variables || [];
    let modVars = modifications.variables || [];
    // Convert to array of objects if needed
    if (!Array.isArray(baseVars)) baseVars = [baseVars];
    if (!Array.isArray(modVars)) modVars = [modVars];
    // Merge arrays, with modifications taking precedence for duplicate keys
    const varMap = {};
    baseVars.forEach(obj => {
      const key = Object.keys(obj)[0];
      varMap[key] = obj[key];
    });
    modVars.forEach(obj => {
      const key = Object.keys(obj)[0];
      varMap[key] = obj[key];
    });
    // Rebuild as array of objects
    modifiedShape.variables = Object.entries(varMap).map(([k, v]) => ({ [k]: v }));
  }
  
  // Process style templates with animation variables
  if (modifications.style) {
    // Process each style property for template expressions
    Object.keys(modifications.style).forEach(key => {
      const value = modifications.style[key];
      if (typeof value === 'string' && value.includes('${')) {
        // This is a template string that needs to be processed during animation
        if (!modifications.animations) {
          modifications.animations = { styleAnimations: {} };
        } else if (!modifications.animations.styleAnimations) {
          modifications.animations.styleAnimations = {};
        }
        
        // Store this as a style animation expression
        modifications.animations.styleAnimations[key] = value;
        
        // For the initial value, use a placeholder
        modifications.style[key] = value.replace(/\${(.*?)}/g, '0');
      }
    });
  }
  
  // Set up animations from the modifications
  if (modifications.animations) {
    // Create or update animations structure in the shape data
    modifiedShape.animations = {
      duration: modifications.animations.duration || 5,
      loops: modifications.animations.loops || 0,
      controlPointAnimations: {},
      styleAnimations: modifications.animations.styleAnimations || {}
    };
    
    // Copy control point animations directly from the modifications
    if (modifications.animations.controlPointAnimations) {
      // Just directly copy the control point animations - no special handling needed
      // since we're only using expressions now
      modifiedShape.animations.controlPointAnimations = JSON.parse(
        JSON.stringify(modifications.animations.controlPointAnimations)
      );
    }
    
    // Add position animations if present
    if (modifications.animations.positionAnimations) {
      modifiedShape.animations.positionAnimations = 
        JSON.parse(JSON.stringify(modifications.animations.positionAnimations));
    }
    
    // Copy style animations if present
    if (modifications.animations.styleAnimations) {
      modifiedShape.animations.styleAnimations = 
        JSON.parse(JSON.stringify(modifications.animations.styleAnimations));
    }
  }
  
  return modifiedShape;
};

/**
 * Loads modifications from a modifications file
 * @param {string} modPath - Path to the modifications JSON file
 * @returns {Promise<Object>} - The loaded modifications
 */
export const loadModifications = async (modPath) => {
  try {
    const response = await fetch(modPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load modifications: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading modifications:', error);
    return null;
  }
};
