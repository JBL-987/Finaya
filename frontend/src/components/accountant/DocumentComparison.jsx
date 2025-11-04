import React, { useState, useEffect } from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import { formatCurrency as formatCurrencyService } from "../../services/currencies";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Download,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";

const DocumentComparison = ({
  transaction,
  onClose,
  onVerify,
  onFlagIssue,
  handleFileDownload,
  files,
}) => {
  const [notes, setNotes] = useState("");
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [sourceFile, setSourceFile] = useState(null);

  useEffect(() => {
    // Find the source file
    if (transaction?.sourceFile) {
      const file = files.find((f) => f.name === transaction.sourceFile);
      setSourceFile(file);
    }
  }, [transaction, files]);

  const handleVerify = () => {
    onVerify(transaction.id, notes);
    setNotes("");
  };

  const handleFlagIssue = () => {
    onFlagIssue(transaction.id, notes);
    setNotes("");
  };

  const { selectedCurrency } = useCurrency();
  const formatCurrency = (amount) => formatCurrencyService(amount, selectedCurrency);

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            Document Verification
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">
              Transaction Details
            </h4>

            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Description:</span>
                <span className="text-white">{transaction.description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Date:</span>
                <span className="text-white">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Category:</span>
                <span className="text-white">{transaction.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">{transaction.transactionType}</span>
              </div>
              {transaction.reference && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Reference:</span>
                  <span className="text-white">{transaction.reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document Preview */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">
              Source Document
            </h4>

            {sourceFile ? (
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium">
                      {sourceFile.name}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleFileDownload(
                          sourceFile.name,
                          "source",
                          sourceFile.url || null
                        )
                      }
                      className="p-2 rounded-md bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors"
                      title="Download source file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        setShowDocumentPreview(!showDocumentPreview)
                      }
                      className="p-2 rounded-md bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                      title="Toggle preview"
                    >
                      {showDocumentPreview ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {showDocumentPreview && (
                  <div className="mt-4 p-4 bg-black rounded-md max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {/* Placeholder for document content preview */}
                      Document content will be displayed here when preview is implemented...
                    </pre>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  File Type: {sourceFile.type || "Unknown"} •
                  Modified: {sourceFile.date ? new Date(sourceFile.date).toLocaleDateString() : "Unknown"}
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400">
                    {transaction.sourceFile
                      ? `Source document "${transaction.sourceFile}" not available`
                      : "No source document attached"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Actions */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">
            Add Verification Notes
          </h4>

          <div className="mb-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this transaction verification..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleVerify}
              className="flex items-center px-4 py-2 bg-green-900/80 text-green-300 rounded-md hover:bg-green-900/100 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Transaction
            </button>
            <button
              onClick={handleFlagIssue}
              className="flex items-center px-4 py-2 bg-red-900/80 text-red-300 rounded-md hover:bg-red-900/100 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Flag as Issue
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentComparison;
