/**
 * Utility for tracking positions of data in source documents
 * This helps create an audit trail linking transactions to their source documents
 */

import api from '../services/api';

// Store document position data in backend API
export const storeDocumentPosition = async (transactionId, documentName, extractionData) => {
  try {
    const response = await api.post('/document/positions', {
      document_name: documentName,
      extraction_data: extractionData,
      transaction_id: transactionId || null
    });

    return response.data.success;
  } catch (error) {
    console.error('Failed to store document position:', error);
    return false;
  }
};

// Get document position data for a transaction
export const getDocumentPosition = async (transactionId) => {
  try {
    const response = await api.get(`/document/positions/transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Failed to get document position:', error);
    return null;
  }
};

// Get all document positions
export const getAllDocumentPositions = async () => {
  try {
    const response = await api.get('/document/positions');
    return response.data;
  } catch (error) {
    console.error('Failed to get all document positions:', error);
    return [];
  }
};

// Check if a transaction has position data
export const hasDocumentPosition = async (transactionId) => {
  try {
    const position = await getDocumentPosition(transactionId);
    return !!position;
  } catch (error) {
    console.error('Failed to check document position:', error);
    return false;
  }
};

// Get all transactions for a specific document
export const getTransactionsForDocument = async (documentName) => {
  try {
    const positions = await getAllDocumentPositions();
    return positions
      .filter(position => position.document_name === documentName)
      .map(position => position.transaction_id)
      .filter(id => id !== null);
  } catch (error) {
    console.error('Failed to get transactions for document:', error);
    return [];
  }
};
