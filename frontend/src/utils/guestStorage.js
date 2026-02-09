/**
 * Guest Storage Utility
 * Manages temporary analysis storage for non-authenticated users
 */

const GUEST_STORAGE_KEY = 'finaya_guest_analyses';
const MAX_GUEST_ANALYSES = 10; // Limit to prevent localStorage overflow

/**
 * Save an analysis for guest user
 * @param {Object} analysisData - Analysis data to save
 * @returns {Object} - Saved analysis with generated ID
 */
export const saveGuestAnalysis = (analysisData) => {
  try {
    const guestAnalyses = getGuestAnalyses();
    
    // Generate a unique ID
    const newAnalysis = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...analysisData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isGuest: true,
    };

    // Add to beginning of array (most recent first)
    guestAnalyses.unshift(newAnalysis);

    // Limit the number of stored analyses
    if (guestAnalyses.length > MAX_GUEST_ANALYSES) {
      guestAnalyses.splice(MAX_GUEST_ANALYSES);
    }

    // Save to localStorage
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestAnalyses));
    
    return newAnalysis;
  } catch (error) {
    console.error('Failed to save guest analysis:', error);
    return null;
  }
};

/**
 * Get all guest analyses
 * @returns {Array} - Array of guest analyses
 */
export const getGuestAnalyses = () => {
  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get guest analyses:', error);
    return [];
  }
};

/**
 * Get a specific guest analysis by ID
 * @param {string} id - Analysis ID
 * @returns {Object|null} - Analysis object or null
 */
export const getGuestAnalysisById = (id) => {
  try {
    const analyses = getGuestAnalyses();
    return analyses.find(a => a.id === id) || null;
  } catch (error) {
    console.error('Failed to get guest analysis:', error);
    return null;
  }
};

/**
 * Delete a guest analysis
 * @param {string} id - Analysis ID to delete
 * @returns {boolean} - Success status
 */
export const deleteGuestAnalysis = (id) => {
  try {
    const analyses = getGuestAnalyses();
    const filtered = analyses.filter(a => a.id !== id);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete guest analysis:', error);
    return false;
  }
};

/**
 * Clear all guest analyses
 * @returns {boolean} - Success status
 */
export const clearGuestAnalyses = () => {
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear guest analyses:', error);
    return false;
  }
};

/**
 * Migrate guest analyses to authenticated user account
 * This should be called after user signs up/logs in
 * @param {Function} saveToBackend - Function to save analyses to backend
 * @returns {Promise<Object>} - Migration result
 */
export const migrateGuestAnalysesToUser = async (saveToBackend) => {
  try {
    const guestAnalyses = getGuestAnalyses();
    
    if (guestAnalyses.length === 0) {
      return { success: true, migrated: 0 };
    }

    let migrated = 0;
    const errors = [];

    for (const analysis of guestAnalyses) {
      try {
        // Remove guest-specific fields before saving
        const cleanAnalysis = {
          name: analysis.name,
          location: analysis.location,
          analysis_type: analysis.analysis_type || 'business',
          data: analysis.data,
          gemini_analysis: analysis.gemini_analysis,
        };

        await saveToBackend(cleanAnalysis);
        migrated++;
      } catch (error) {
        console.error('Failed to migrate analysis:', error);
        errors.push({ id: analysis.id, error });
      }
    }

    // Clear guest storage after migration
    if (migrated > 0) {
      clearGuestAnalyses();
    }

    return {
      success: true,
      migrated,
      total: guestAnalyses.length,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    console.error('Failed to migrate guest analyses:', error);
    return { success: false, error };
  }
};

/**
 * Check if user has guest analyses
 * @returns {boolean}
 */
export const hasGuestAnalyses = () => {
  return getGuestAnalyses().length > 0;
};

/**
 * Get guest analyses count
 * @returns {number}
 */
export const getGuestAnalysesCount = () => {
  return getGuestAnalyses().length;
};
