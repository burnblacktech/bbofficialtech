// =====================================================
// FACT PRESENCE RESOLVER (S22)
// Pure utility to check if facts exist in jsonPayload
// =====================================================

/**
 * Utility to check fact presence in filing payload
 * 
 * Rules:
 * - Path-based navigation (e.g., 'income.salary')
 * - OR groups supported (e.g., 'salary|houseProperty')
 * - Empty object = not present
 * - Empty array = not present
 * - No interpretation, just existence
 */
class FactPresenceResolver {
    /**
     * Check if fact path exists in payload
     * @param {Object} payload - jsonPayload from ITRFiling
     * @param {string} path - Dot-notation path (e.g., 'income.salary')
     * @returns {boolean} True if fact exists and is non-empty
     */
    static hasFactPath(payload, path) {
        if (!payload || typeof payload !== 'object') {
            return false;
        }

        // Handle OR groups (salary|houseProperty)
        if (path.includes('|')) {
            const paths = path.split('|');
            return paths.some(p => this.hasFactPath(payload, p.trim()));
        }

        // Navigate path
        const parts = path.split('.');
        let current = payload;

        for (const part of parts) {
            if (!current || typeof current !== 'object') {
                return false;
            }
            current = current[part];
        }

        // Check if value exists and is non-empty
        if (current === undefined || current === null) {
            return false;
        }

        // Empty array = not present
        if (Array.isArray(current)) {
            return current.length > 0;
        }

        // Empty object = not present
        if (typeof current === 'object') {
            return Object.keys(current).length > 0;
        }

        // Primitive value exists
        return true;
    }

    /**
     * Get all missing fact paths from a list of required paths
     * @param {Object} payload - jsonPayload from ITRFiling
     * @param {string[]} requiredPaths - Array of required fact paths
     * @returns {string[]} Array of missing fact paths
     */
    static getMissingPaths(payload, requiredPaths) {
        return requiredPaths.filter(path => !this.hasFactPath(payload, path));
    }

    /**
     * Check if any forbidden fact paths exist
     * @param {Object} payload - jsonPayload from ITRFiling
     * @param {string[]} forbiddenPaths - Array of forbidden fact paths
     * @returns {string|null} First forbidden path found, or null if none
     */
    static getFirstForbiddenPath(payload, forbiddenPaths) {
        for (const path of forbiddenPaths) {
            if (this.hasFactPath(payload, path)) {
                return path;
            }
        }
        return null;
    }
}

module.exports = FactPresenceResolver;
