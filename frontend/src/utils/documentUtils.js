import { getTransactionsForDocument as getTransactionIdsForDocument } from './documentPositionTracker';
import api from '../services/api';

/**
 * Mendapatkan semua transaksi yang terkait dengan dokumen
 * @param {string} documentName - Nama dokumen (opsional)
 * @returns {Array} - Array transaksi
 */
export const getTransactionsForDocument = async (documentName = null) => {
  try {
    console.log("Getting transactions for document:", documentName);

    // Jika documentName tidak disediakan, dapatkan semua transaksi dari API
    if (!documentName) {
      try {
        const response = await api.get('/accounting/transactions');
        return response.data;
      } catch (apiError) {
        console.log("API failed, falling back to localStorage...");
        const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        return allTransactions;
      }
    }

    // Dapatkan ID transaksi yang terkait dengan dokumen
    const transactionIds = await getTransactionIdsForDocument(documentName);

    // Jika tidak ada transaksi terkait, kembalikan array kosong
    if (transactionIds.length === 0) {
      return [];
    }

    try {
      // Dapatkan semua transaksi dari API
      const response = await api.get('/accounting/transactions');
      const allTransactions = response.data;

      // Filter transaksi berdasarkan ID
      const documentTransactions = allTransactions.filter(transaction =>
        transactionIds.includes(transaction.id)
      );

      console.log(`Found ${documentTransactions.length} transactions for document ${documentName}`);
      return documentTransactions;
    } catch (apiError) {
      console.log("API failed, falling back to localStorage...");
      // Fallback to localStorage
      const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const documentTransactions = allTransactions.filter(transaction =>
        transactionIds.includes(transaction.id)
      );
      return documentTransactions;
    }
  } catch (error) {
    console.error("Error getting transactions for document:", error);
    return [];
  }
};
