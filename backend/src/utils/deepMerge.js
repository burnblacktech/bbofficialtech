/**
 * deepMerge.js
 * Recursive deep merge utility for jsonPayload updates.
 *
 * Rules:
 *  - Plain objects: recurse, preserving target keys absent from source
 *  - Arrays: source replaces target wholesale
 *  - null: overwrites target
 *  - Primitives: source overwrites target
 *
 * Properties:
 *  - Identity:      deepMerge(X, {}) ≡ X
 *  - Associativity: deepMerge(deepMerge(X, A), B) ≡ deepMerge(X, deepMerge(A, B))
 */

/**
 * Returns true when value is a plain object (not null, not an array, not a Date, etc.)
 */
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively merge `source` into `target`, returning a new object.
 * Neither `target` nor `source` is mutated.
 *
 * @param {object} target - base object
 * @param {object} source - patch to apply
 * @returns {object} merged result
 */
function deepMerge(target, source) {
  // If source is not a plain object, return source (overwrite)
  if (!isPlainObject(source)) return source;
  // If target is not a plain object, source wins
  if (!isPlainObject(target)) return deepMerge({}, source);

  const result = {};

  // Copy all target keys first
  for (const key of Object.keys(target)) {
    result[key] = target[key];
  }

  // Merge source keys on top
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = result[key];

    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      // Both plain objects → recurse
      result[key] = deepMerge(tgtVal, srcVal);
    } else {
      // Arrays, null, primitives → source wins
      result[key] = srcVal;
    }
  }

  return result;
}

module.exports = deepMerge;
