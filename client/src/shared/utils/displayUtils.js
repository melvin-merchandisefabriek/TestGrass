/**
 * Utility functions for handling shape display options
 */

/**
 * Gets default display options for shapes
 * @returns {Object} Default display options
 */
export const getDefaultDisplayOptions = () => {
  return {
    showControlPoints: true,
    showAnchorPoints: true,
    showPositionAnchor: true,
    showBorder: true,
    showControlPointNames: false // Off by default as it can be visually noisy
  };
};

/**
 * Merges user-provided display options with defaults
 * @param {Object} options - User provided display options
 * @returns {Object} Merged display options
 */
export const mergeDisplayOptions = (options) => {
  const defaults = getDefaultDisplayOptions();
  
  // Handle null/undefined options or empty object
  if (!options || Object.keys(options).length === 0) {
    return defaults;
  }
  
  return { ...defaults, ...options };
};

/**
 * Creates display options with all settings set to the same value
 * @param {boolean} value - Value to set for all display options
 * @returns {Object} Display options with all settings set to value
 */
export const createUniformDisplayOptions = (value = true) => {
  return {
    showControlPoints: value,
    showAnchorPoints: value,
    showPositionAnchor: value,
    showBorder: value,
    showControlPointNames: value
  };
};

/**
 * Creates display options for "editing mode" - all points visible
 * @returns {Object} Display options for editing mode
 */
export const getEditingModeOptions = () => {
  return createUniformDisplayOptions(true);
};

/**
 * Creates display options for "viewing mode" - no points visible
 * @returns {Object} Display options for viewing mode
 */
export const getViewingModeOptions = () => {
  return createUniformDisplayOptions(false);
};

/**
 * Toggles a specific display option
 * @param {Object} currentOptions - Current display options
 * @param {string} optionKey - The option key to toggle
 * @returns {Object} Updated display options
 */
export const toggleDisplayOption = (currentOptions, optionKey) => {
  if (!currentOptions || !Object.prototype.hasOwnProperty.call(currentOptions, optionKey)) {
    return currentOptions;
  }
  
  return {
    ...currentOptions,
    [optionKey]: !currentOptions[optionKey]
  };
};
