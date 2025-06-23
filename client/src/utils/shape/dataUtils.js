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
 * Converts a hex color code to rgba format
 * @param {string} hex - The hex color code (with or without #)
 *                     - Can be 3 digits (#RGB), 6 digits (#RRGGBB), or 8 digits (#RRGGBBAA)
 * @returns {string} - The rgba color string (e.g., "rgba(255, 0, 0, 0.5)")
 */
export const hexToRgba = (hex) => {
  // Remove the hash if it exists
  let cleanHex = hex.replace(/^#/, '');
  let hexAlpha = 1; // Default alpha is 1 (fully opaque)
  
  // Handle hex with alpha included (8 digits)
  if (cleanHex.length === 8) {
    hexAlpha = parseInt(cleanHex.substr(6, 2), 16) / 255;
    cleanHex = cleanHex.substr(0, 6);
  }
  
  // Handle shorthand hex (e.g., #FFF)
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('');
  }
  
  // Parse the hex values
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  
  // Ensure alpha is within valid range
  const validAlpha = Math.max(0, Math.min(1, hexAlpha));
  
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
};

/**
 * Processes color values in shape data, converting hex to rgba when needed
 * @param {Object} shapeData - The shape data object
 * @returns {Object} - Updated shape data with converted colors
 */
export const processColors = (shapeData) => {
  // Create a deep copy to avoid mutating the original
  const processedData = JSON.parse(JSON.stringify(shapeData));
  
  // Helper function to process any color property
  const processColorProperty = (styleObj, property) => {
    if (styleObj && styleObj[property] && typeof styleObj[property] === 'string' && styleObj[property].startsWith('#')) {
      // For fill/stroke, check if there's an opacity property
      const opacityProp = `${property}Opacity`;
      
      // If we have an opacity property, append it to the hex code
      if (styleObj[opacityProp] !== undefined) {
        // Convert opacity (0-1) to hex (00-FF)
        const alphaHex = Math.round(styleObj[opacityProp] * 255)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase();
          
        // Remove any existing hash
        const baseHex = styleObj[property].replace(/^#/, '');
        
        // If it's already an 8-digit hex, don't modify
        if (baseHex.length !== 8) {
          // Handle shorthand hex
          const fullHex = baseHex.length === 3 
            ? baseHex.split('').map(c => c + c).join('')
            : baseHex;
            
          // Create new hex with alpha
          styleObj[property] = '#' + fullHex + alphaHex;
        }
        
        // Remove opacity property as it's now incorporated in the hex
        delete styleObj[opacityProp];
      }
      
      // Convert the hex (with or without alpha) to rgba
      styleObj[property] = hexToRgba(styleObj[property]);
    }
  };
  
  // Process style for the main shape
  if (processedData.style) {
    processColorProperty(processedData.style, 'fill');
    processColorProperty(processedData.style, 'stroke');
  }
  
  // Process styles for individual segments
  if (processedData.segments) {
    processedData.segments.forEach(segment => {
      if (segment.style) {
        processColorProperty(segment.style, 'fill');
        processColorProperty(segment.style, 'stroke');
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
    const dataWithNumericValues = processNumericValues(shapeData);
    
    // Process color values (by default, don't auto-process colors - set to true if needed)
    const autoProcessColors = false;
    return autoProcessColors ? processColors(dataWithNumericValues) : dataWithNumericValues;
  } catch (error) {
    console.error('Error loading shape data:', error);
    throw new Error(`Failed to load shape data from ${filePath}`);
  }
};
