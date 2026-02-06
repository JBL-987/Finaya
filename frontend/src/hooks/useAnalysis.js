import { useState, useCallback } from 'react';
import { analysisAPI } from '../services/api';

export const useAnalysis = () => {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAnalyses = useCallback(async (offset = 0, limit = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.getAll(offset, limit);
      setAnalyses(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAnalysis = useCallback(async (analysisId) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.getById(analysisId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAnalysis = useCallback(async (analysisData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.save(analysisData);
      setAnalyses(prev => [result, ...prev]);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAnalysis = useCallback(async (analysisId, updateData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.update(analysisId, updateData);
      setAnalyses(prev =>
        prev.map(analysis =>
          analysis.id === analysisId ? result : analysis
        )
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAnalysis = useCallback(async (analysisId) => {
    setIsLoading(true);
    setError(null);
    try {
      await analysisAPI.delete(analysisId);
      setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const aiAnalyze = useCallback(async (imageBase64, imageMetadata) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.aiAnalyze(imageBase64, imageMetadata);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateAnalysis = useCallback(async (location, businessParams, screenshotBase64, screenshotMetadata) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.calculate(location, businessParams, screenshotBase64, screenshotMetadata);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analyses,
    isLoading,
    error,
    getAnalyses,
    getAnalysis,
    createAnalysis,
    updateAnalysis,
    deleteAnalysis,
    aiAnalyze,
    calculateAnalysis
  };
};
