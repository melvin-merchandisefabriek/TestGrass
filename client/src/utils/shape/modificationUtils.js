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
    if (modifiedShape.position?.global) {
      modifiedShape.position.global.x += modifications.modifyPosition.x || 0;
      modifiedShape.position.global.y += modifications.modifyPosition.y || 0;
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
  
  // Set up animations from the modifications
  if (modifications.animations) {
    // Create or update animations structure in the shape data
    modifiedShape.animations = {
      duration: modifications.animations.duration || 5,
      loops: modifications.animations.loops || 0,
      controlPointAnimations: {}
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
