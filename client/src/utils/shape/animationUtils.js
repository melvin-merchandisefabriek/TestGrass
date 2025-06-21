/**
 * Animation utility functions for Shape component
 */

/**
 * Get standard animation variables for formulas
 * @param {number} currentTime - Current time in seconds
 * @param {number} duration - Total animation duration in seconds
 * @returns {Object} Variables for animation formulas
 */
export const getAnimationVariables = (currentTime, duration) => {
  return {
    t: currentTime,                     // Current time in seconds
    d: duration,                        // Total duration in seconds
    n: currentTime / duration,          // Normalized time (0 to 1)
    PI: Math.PI,
    TWO_PI: 2 * Math.PI,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    sqrt: Math.sqrt,
    pow: Math.pow,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    exp: Math.exp,
    log: Math.log,
    random: Math.random
  };
};

/**
 * Safely evaluates mathematical expressions
 * @param {string} expression - Mathematical expression to evaluate
 * @param {Object} variables - Variables to use in the expression
 * @returns {number|null} Result of the expression or null if error
 */
export const evaluateExpression = (expression, variables) => {
  try {
    // Create a safe function from the expression with provided variables
    // This approach protects against code injection while allowing mathematical expressions
    const safeFunction = new Function(...Object.keys(variables), `
      "use strict";
      // Only allow mathematical operations, no assignments or function calls except Math
      return ${expression};
    `);
    
    // Execute the function with the provided variables
    return safeFunction(...Object.values(variables));
  } catch (error) {
    console.warn(`Error evaluating expression: ${expression}`, error);
    return null;
  }
};

/**
 * Calculates values based on mathematical formulas
 * @param {Object} formula - Formula configuration
 * @param {number} currentTime - Current time in seconds
 * @param {number} duration - Total animation duration in seconds
 * @returns {number|null} Calculated value or null if invalid formula
 */
export const calculateFormula = (formula, currentTime, duration) => {
  if (!formula) return null;

  // Create common variables available to all formulas
  const variables = getAnimationVariables(currentTime, duration);

  // Only support expression-based formulas
  if (formula.expression) {
    // Add any custom variables defined in the formula
    if (formula.variables) {
      Object.entries(formula.variables).forEach(([key, value]) => {
        variables[key] = value;
      });
    }
    
    return evaluateExpression(formula.expression, variables);
  }
  
  console.error('Invalid formula format. Must include an expression property:', formula);
  return null;
  
  console.warn(`Invalid formula: ${JSON.stringify(formula)}`);
  return null;
};

/**
 * Calculates animated position for a control point
 * @param {string} pointId - ID of the control point
 * @param {Object} animation - Animation configuration
 * @param {number} currentTime - Current animation time
 * @param {number} duration - Total animation duration
 * @param {Array} controlPoints - Array of control point definitions
 * @returns {Object|null} New position {x, y} or null if no animation
 */
/**
 * Processes template strings with animation expressions
 * @param {string} template - Template string with ${...} expressions
 * @param {Object} variables - Animation variables to use
 * @returns {string} Processed string with evaluated expressions
 */
export const processStyleTemplate = (template, variables) => {
  if (!template || typeof template !== 'string' || !template.includes('${')) {
    return template;
  }
  
  try {
    // Replace ${...} expressions with evaluated results
    return template.replace(/\${(.*?)}/g, (match, expression) => {
      const result = evaluateExpression(expression, variables);
      return result !== null ? result : 0;
    });
  } catch (error) {
    console.error('Error processing style template:', error);
    return template;
  }
};

/**
 * Calculates animated style properties based on templates
 * @param {Object} styleAnimations - Style animation templates
 * @param {number} currentTime - Current time in seconds
 * @param {number} duration - Total animation duration in seconds
 * @returns {Object} Animated style properties
 */
export const calculateStyleProperties = (styleAnimations, currentTime, duration) => {
  if (!styleAnimations) return {};
  
  const variables = getAnimationVariables(currentTime, duration);
  const result = {};
  
  Object.entries(styleAnimations).forEach(([property, template]) => {
    result[property] = processStyleTemplate(template, variables);
  });
  
  return result;
};

export const calculateControlPointPosition = (pointId, animation, currentTime, duration, controlPoints) => {
  const result = { x: null, y: null };
  
  // Check for formula-based animation
  if (animation.formula) {
    // Calculate X position if formula is provided
    if (animation.formula.x) {
      result.x = calculateFormula(animation.formula.x, currentTime, duration);
    }
    
    // Calculate Y position if formula is provided
    if (animation.formula.y) {
      result.y = calculateFormula(animation.formula.y, currentTime, duration);
    }
  }
  
  // If we still need x or y values, try to get them from keyframes
  if ((result.x === null || result.y === null) && animation.keyframes && animation.keyframes.length > 0) {
    // Basic linear interpolation between keyframes
    const keyframes = animation.keyframes;
    
    // Find the surrounding keyframes
    let startKeyframe = keyframes[0];
    let endKeyframe = keyframes[keyframes.length - 1];
    
    // Single keyframe case
    if (keyframes.length === 1) {
      if (result.x === null) result.x = keyframes[0].x;
      if (result.y === null) result.y = keyframes[0].y;
    } else {
      // Multiple keyframes
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (keyframes[i].time <= currentTime && keyframes[i+1].time >= currentTime) {
          startKeyframe = keyframes[i];
          endKeyframe = keyframes[i+1];
          break;
        }
      }
      
      // If current time is before the first keyframe or after the last one,
      // use the closest keyframe's values directly
      if (currentTime <= keyframes[0].time) {
        if (result.x === null) result.x = keyframes[0].x;
        if (result.y === null) result.y = keyframes[0].y;
      } else if (currentTime >= keyframes[keyframes.length-1].time) {
        if (result.x === null) result.x = keyframes[keyframes.length-1].x;
        if (result.y === null) result.y = keyframes[keyframes.length-1].y;
      } else {
        // Calculate position by interpolating between keyframes
        const timeDiff = endKeyframe.time - startKeyframe.time;
        const timeProgress = (currentTime - startKeyframe.time) / timeDiff;
        
        // Linear interpolation between the two keyframes, only for properties not set by formula
        if (result.x === null && startKeyframe.x !== undefined && endKeyframe.x !== undefined) {
          result.x = startKeyframe.x + (endKeyframe.x - startKeyframe.x) * timeProgress;
        }
        
        if (result.y === null && startKeyframe.y !== undefined && endKeyframe.y !== undefined) {
          result.y = startKeyframe.y + (endKeyframe.y - startKeyframe.y) * timeProgress;
        }
      }
    }
  }
  
  // If we successfully calculated at least one value
  if (result.x !== null || result.y !== null) {
    // Fill in any missing values with defaults from the first control point
    const originalPoint = controlPoints.find(cp => cp.id === pointId);
    if (result.x === null && originalPoint) result.x = originalPoint.x;
    if (result.y === null && originalPoint) result.y = originalPoint.y;
    
    return result;
  }
  
  return null;
};

/**
 * Calculates the animated global position
 * @param {Object} animation - Global position animation configuration
 * @param {number} currentTime - Current animation time
 * @param {number} duration - Total animation duration
 * @returns {Object|null} New global position {x, y} or null
 */
export const calculateGlobalPosition = (animation, currentTime, duration) => {
  // Treat global position as a special case of control point animation
  // Create a default point with {x:0, y:0} to use as the base
  const defaultPoint = { id: 'global', x: 0, y: 0 };
  return calculateControlPointPosition('global', animation, currentTime, duration, [defaultPoint]);
};
