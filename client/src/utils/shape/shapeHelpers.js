/**
 * Helper utility functions for Shape component
 */

/**
 * Updates animation values based on current time
 * @param {number} currentTime - Current animation time
 * @param {Object} shapeData - Shape configuration
 * @param {Object} animatedControlPoints - Current animated control points
 * @param {Object} animatedPosition - Current animated global position
 * @param {Function} setAnimatedControlPoints - Setter function for control points
 * @param {Function} setAnimatedPosition - Setter function for position
 * @param {Function} deepEquals - Deep equality comparison function
 * @param {Function} calculateControlPointPosition - Function to calculate control point position
 * @param {Function} calculateGlobalPosition - Function to calculate global position
 * @param {Function} updateAffectedSegments - Function to update affected segments
 * @param {Object} segmentRefs - References to segment DOM elements
 * @param {Object} containerRef - Reference to container DOM element
 */
export const updateAnimationValues = (
  currentTime,
  shapeData,
  animatedControlPoints,
  animatedPosition,
  setAnimatedControlPoints,
  setAnimatedPosition,
  deepEquals,
  calculateControlPointPosition,
  calculateGlobalPosition,
  updateAffectedSegments,
  segmentRefs,
  containerRef
) => {
  // Track which segments need to be redrawn
  const affectedSegments = new Set();
  
  // Process control point animations
  const newAnimatedControlPoints = { ...animatedControlPoints };
  
  if (shapeData.animations?.controlPointAnimations) {
    Object.entries(shapeData.animations.controlPointAnimations).forEach(([pointId, animation]) => {
      // Find the segments that use this control point
      shapeData.segments.forEach(segment => {
        if (segment.points.includes(pointId)) {
          affectedSegments.add(segment.id);
        }
      });
      
      // Calculate new position for this control point
      const animatedValues = calculateControlPointPosition(
        pointId, 
        animation, 
        currentTime, 
        shapeData.animations.duration, 
        shapeData.controlPoints
      );
      if (animatedValues) {
        newAnimatedControlPoints[pointId] = animatedValues;
      }
    });
  }
  
  // Similarly process global position animations
  let newAnimatedPosition = animatedPosition;
  if (shapeData.animations?.positionAnimations?.global) {
    const posAnimation = shapeData.animations.positionAnimations.global;
    
    // Calculate new global position
    const calculatedPosition = calculateGlobalPosition(posAnimation, currentTime);
    if (calculatedPosition) {
      newAnimatedPosition = calculatedPosition;
      
      // All segments are affected by position changes
      shapeData.segments.forEach(segment => {
        affectedSegments.add(segment.id);
      });
    }
  }
  
  // Update state only if the values have changed
  if (!deepEquals(animatedControlPoints, newAnimatedControlPoints)) {
    setAnimatedControlPoints(newAnimatedControlPoints);
  }
  
  if (!deepEquals(animatedPosition, newAnimatedPosition)) {
    setAnimatedPosition(newAnimatedPosition);
  }
  
  // Direct update of affected segments in the DOM
  updateAffectedSegments(
    affectedSegments, 
    shapeData, 
    newAnimatedControlPoints, 
    newAnimatedPosition, 
    segmentRefs.current, 
    containerRef.current
  );
};
