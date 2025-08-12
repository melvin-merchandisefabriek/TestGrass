// Unified variable substitution and deep clone utilities

/**
 * Substitute |var:varName| in a string using a variable lookup object.
 * Handles nested and repeated substitutions.
 * @param {string} expression - The string to process
 * @param {Object} variables - Lookup object for variable values
 * @param {number} [maxIterations=10] - Prevent infinite loops
 * @returns {string}
 */
export function substituteVariables(expression, variables, maxIterations = 10) {
  if (!expression || typeof expression !== 'string' || !expression.includes('|var:')) return expression;
  let processed = expression;
  let changed = true;
  let iterations = 0;
  const varNames = Object.keys(variables).sort((a, b) => b.length - a.length);
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (const name of varNames) {
      const pattern = `|var:${name}|`;
      if (processed.includes(pattern)) {
        const value = variables[name];
        if (value !== undefined) {
          const old = processed;
          processed = processed.split(pattern).join(value);
          if (old !== processed) changed = true;
        }
      }
    }
  }
  return processed;
}

/**
 * Deep clone an object using JSON methods.
 * @param {any} obj
 * @returns {any}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
