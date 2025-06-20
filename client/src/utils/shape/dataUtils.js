/**
 * Utilities for loading and processing shape data
 */

/**
 * Processes numeric values that might be mathematical expressions in the JSON data
 * Example: Converting serialized PI values back to Math.PI
 * @param {Object} data - JSON data that needs processing
 * @returns {Object} - Processed data with mathematical values evaluated
 */
export const processNumericValues = (data) => {
  // Deep clone the data to avoid mutations
  const processedData = JSON.parse(JSON.stringify(data));

  // Process special PI values in animation formulas
  if (processedData.animations?.controlPointAnimations) {
    Object.entries(processedData.animations.controlPointAnimations).forEach(([pointId, animation]) => {
      if (animation?.formula?.y?.variables?.phase) {
        // Convert known PI values back to actual Math values
        if (animation.formula.y.variables.phase.toString() === "1.5707963267948966") {
          animation.formula.y.variables.phase = Math.PI / 2;
        } else if (animation.formula.y.variables.phase.toString() === "3.141592653589793") {
          animation.formula.y.variables.phase = Math.PI;
        } else if (animation.formula.y.variables.phase.toString() === "6.283185307179586") {
          animation.formula.y.variables.phase = Math.PI * 2;
        }
      }
    });
  }

  return processedData;
};

/**
 * Loads shape data from a JSON file path
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} - Shape data object with processed values
 */
export const loadShapeData = async (filePath) => {
  try {
    // Use fetch API to load the JSON file which works better with relative paths
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch shape data: ${response.statusText}`);
    }
    
    const shapeData = await response.json();
    
    // Process any special values in the data
    return processNumericValues(shapeData);
  } catch (error) {
    console.error('Error loading shape data:', error);
    throw new Error(`Failed to load shape data from ${filePath}`);
  }
};
