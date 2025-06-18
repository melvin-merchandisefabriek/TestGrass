/**
 * Utility functions for Bezier path collections
 * This file provides functionality for saving, loading, and transforming collections of Bezier paths
 */

/**
 * Apply a transformation to a collection of paths
 * @param {Array} paths - Array of path objects to transform
 * @param {Object} transformation - Object containing transformation parameters
 * @returns {Array} - Transformed paths
 */
export const transformPaths = (paths, transformation) => {
  const { translate = { x: 0, y: 0 }, 
          scale = { x: 1, y: 1 }, 
          rotate = 0, 
          flipX = false,
          flipY = false } = transformation;
  
  // Convert rotation angle from degrees to radians
  const radians = (rotate * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  
  // Create a deep copy of paths to avoid modifying originals
  return paths.map(path => {
    const newPath = { ...path };
    newPath.points = { ...path.points };
    
    // Transform each point in the path
    Object.keys(path.points).forEach(pointKey => {
      const point = path.points[pointKey];
      let x = point.x;
      let y = point.y;
      
      // Apply flip transformations
      if (flipX) x = -x;
      if (flipY) y = -y;
      
      // Apply scaling
      x = x * scale.x;
      y = y * scale.y;
      
      // Apply rotation around the origin
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      
      // Apply translation
      newPath.points[pointKey] = {
        x: rotatedX + translate.x,
        y: rotatedY + translate.y
      };
    });
    
    return newPath;
  });
};

/**
 * Generate a unique ID for a new collection
 * @returns {string} - Unique collection ID
 */
export const generateCollectionId = () => {
  return 'collection_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
};

/**
 * Save a collection of paths to localStorage
 * @param {Object} collection - Collection object with paths and metadata
 * @returns {boolean} - Success status
 */
export const saveCollection = (collection) => {
  try {
    // Get existing collections
    const existingCollections = getCollections();
    
    // Prepare collection object with timestamp if it's a new collection
    const collectionToSave = {
      ...collection,
      lastModified: new Date().toISOString()
    };
    
    // Check if collection already exists and update it, otherwise add as new
    const existingIndex = existingCollections.findIndex(c => c.id === collection.id);
    
    if (existingIndex >= 0) {
      existingCollections[existingIndex] = collectionToSave;
    } else {
      existingCollections.push(collectionToSave);
    }
    
    // Save back to localStorage
    localStorage.setItem('bezierCollections', JSON.stringify(existingCollections));
    return true;
  } catch (error) {
    console.error('Error saving collection:', error);
    return false;
  }
};

/**
 * Load all collections from localStorage
 * @returns {Array} - Array of collection objects
 */
export const getCollections = () => {
  try {
    const collections = localStorage.getItem('bezierCollections');
    return collections ? JSON.parse(collections) : [];
  } catch (error) {
    console.error('Error loading collections:', error);
    return [];
  }
};

/**
 * Delete a collection from localStorage
 * @param {string} collectionId - ID of the collection to delete
 * @returns {boolean} - Success status
 */
export const deleteCollection = (collectionId) => {
  try {
    const collections = getCollections();
    const filteredCollections = collections.filter(c => c.id !== collectionId);
    localStorage.setItem('bezierCollections', JSON.stringify(filteredCollections));
    return true;
  } catch (error) {
    console.error('Error deleting collection:', error);
    return false;
  }
};

/**
 * Find a specific collection by ID
 * @param {string} collectionId - ID of collection to retrieve
 * @returns {Object|null} - Collection object or null if not found
 */
export const getCollectionById = (collectionId) => {
  const collections = getCollections();
  return collections.find(c => c.id === collectionId) || null;
};

/**
 * Apply a mathematical transformation to a collection and return a new instance
 * @param {Object} collection - Source collection
 * @param {Object} transformation - Transformation parameters
 * @returns {Object} - New transformed collection
 */
export const instantiateWithTransform = (collection, transformation) => {
  // Generate a new ID for this instance
  const newId = generateCollectionId();
  
  // Create a new collection with transformed paths
  return {
    id: newId,
    name: `${collection.name} (Copy)`,
    description: collection.description,
    tags: [...collection.tags],
    paths: transformPaths(collection.paths, transformation),
    groups: collection.groups ? JSON.parse(JSON.stringify(collection.groups)) : [],
    createdFrom: collection.id,
    createdAt: new Date().toISOString(),
    transformation
  };
};
