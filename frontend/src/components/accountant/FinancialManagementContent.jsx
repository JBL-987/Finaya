import React, { useState, useEffect } from "react";
import { accountingAPI } from "../../services/api";

// Import Accountant components
import DataInput from "./DataInput";
import Workspace from "./Workspace";
import Validation from "./Validation";
import Analysis from "./Analysis";
import Reports from "./Reports";
import Recommendations from "./Recommendations";
import LogTrails from "./LogTrails";
import TransactionDetails from "./TransactionDetails";
import ProcessingLog from "./ProcessingLog";

// Import Advisor components
import FinancialPlanning from "../advisor/FinancialPlanning";
import Investment from "../advisor/Investment";
import TaxStrategy from "../advisor/TaxStrategy";

export default function FinancialManagementContent({
  activeMainCategory,
  activeSubTab,
  onLoadTransactions
}) {
  // State management
  const [files, setFiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [errorMessage, setErrorMessage] = useState();
  const [fileTransferProgress, setFileTransferProgress] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Processing log state
  const [processingLogs, setProcessingLogs] = useState([]);
  const [showProcessingLog, setShowProcessingLog] = useState(false);
  const [minimizeProcessingLog, setMinimizeProcessingLog] = useState(false);

  // Helper function to extract JSON from text
  function extractJsonFromText(text) {
    console.log("Attempting to extract JSON from text");

    // First, check if the text is already valid JSON
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log("Text is already valid JSON array");
        return text;
      }
    } catch (e) {
      // Not valid JSON, continue with extraction
    }

    // Handle the specific format we're seeing in the logs
    if (text.includes("```json") && text.includes("```")) {
      console.log("Found markdown JSON code block");
      // Extract content between ```json and ```
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        const jsonContent = match[1].trim();
        console.log(
          "Extracted from code block:",
          jsonContent.substring(0, 50) + "..."
        );
        return jsonContent;
      }
    }

    // Try to extract from any markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const potentialJson = codeBlockMatch[1].trim();
      console.log(
        "Found content in code block:",
        potentialJson.substring(0, 50) + "..."
      );

      // Check if it starts with [ and ends with ]
      if (potentialJson.startsWith("[") && potentialJson.endsWith("]")) {
        return potentialJson;
      }
    }

    // Look for anything that looks like a JSON array
    const jsonPattern = /\[\s*\{\s*"[^"]+"\s*:[\s\S]*?\}\s*\]/g;
    const jsonMatches = text.match(jsonPattern);
    if (jsonMatches && jsonMatches.length > 0) {
      console.log("Found JSON-like array pattern");
      return jsonMatches[0];
    }

    // Most aggressive approach - just find everything between the first [ and the last ]
    const startBracket = text.indexOf("[");
    const endBracket = text.lastIndexOf("]");

    if (startBracket !== -1 && endBracket !== -1 && startBracket < endBracket) {
      console.log("Extracting everything between first [ and last ]");
      return text.substring(startBracket, endBracket + 1).trim();
    }

    // If all else fails, try to find individual JSON objects and combine them
    const objectPattern = /\{\s*"[^"]+"\s*:[\s\S]*?(?:\}\s*,|\}$)/g;
    const matches = Array.from(text.matchAll(objectPattern));
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} potential JSON objects`);
      const objects = matches.map((match) => {
        let obj = match[0].trim();
        if (obj.endsWith(",")) {
          obj = obj.slice(0, -1);
        }
        return obj;
      });
      return "[" + objects.join(",") + "]";
    }

    console.log("Could not extract JSON from text");
    return null;
  }

  const GEMINI_API_KEY = "AIzaSyCH6esa0di5rgxVJHq8Os2YaBIMzFAOUgc";

  // File handling functions
  const handleFileUpload = async (file) => {
    console.log("Uploading file:", file);
    addProcessingLog(`Uploading file: ${file.name}`, "info");

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Here you would normally send to backend API
      // For now, just add to files list
      setFiles(prevFiles => [...prevFiles, {
        id: Date.now(),
        name: file.name,
        type: file.type,
        size: file.size,
        date: new Date().toISOString(),
        status: 'uploaded'
      }]);

      addProcessingLog(`File uploaded successfully: ${file.name}`, "success");
    } catch (error) {
      addProcessingLog(`Failed to upload file: ${error.message}`, "error");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileDownload = (fileName, category, fileUrl) => {
    console.log("Downloading file:", fileName, category, fileUrl);
    addProcessingLog(`Downloading file: ${fileName}`, "info");

    // Here you would implement actual file download logic
    // For now, just show a message
    addProcessingLog(`File download not yet implemented`, "warning");
  };

  const handleFileProcessing = async (file) => {
    console.log("Processing file:", file);
    setAnalyzingFile(file.name);
    addProcessingLog(`Processing file: ${file.name}`, "info");

    try {
      // Here you would implement file processing logic
      // For now, just simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update file status
      setFiles(prevFiles => prevFiles.map(f =>
        f.name === file.name ? { ...f, status: 'processed' } : f
      ));

      addProcessingLog(`File processed successfully: ${file.name}`, "success");
    } catch (error) {
      addProcessingLog(`Failed to process file: ${error.message}`, "error");
    } finally {
      setAnalyzingFile("");
    }
  };

  const handleFileDelete = async (fileName) => {
    console.log("Deleting file:", fileName);
    addProcessingLog(`Deleting file: ${fileName}`, "info");

    try {
      setFiles(prevFiles => prevFiles.filter(f => f.name !== fileName));
      addProcessingLog(`File deleted: ${fileName}`, "success");
    } catch (error) {
      addProcessingLog(`Failed to delete file: ${error.message}`, "error");
    }
  };

  const handleProcessAllFiles = async () => {
    console.log("Processing all files");
    addProcessingLog("Processing all files", "info");

    const unprocessedFiles = files.filter(f => f.status !== 'processed');
    for (const file of unprocessedFiles) {
      await handleFileProcessing(file);
    }
  };

  const getFileIcon = (fileType) => {
    // Return file icon based on type
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('csv')) return '📈';
    return '📁';
  };

  const handleSaveManualData = async (manualData) => {
    console.log("Saving manual data:", manualData);
    addProcessingLog("Saving manual transaction data", "info");

    try {
      // Here you would save to backend API
      // For now, just add to transactions
      const newTransaction = {
        id: Date.now(),
        date: manualData.date,
        description: manualData.description,
        amount: manualData.amount,
        category: manualData.category,
        transactionType: manualData.transactionType,
        sourceFile: "Manual Entry",
        timestamp: new Date().toISOString()
      };

      setTransactions(prevTransactions => [...prevTransactions, newTransaction]);

      addProcessingLog("Manual transaction saved successfully", "success");
    } catch (error) {
      addProcessingLog(`Failed to save manual data: ${error.message}`, "error");
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Transaction handling functions
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCloseTransactionDetails = () => {
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = async (transactionId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This transaction will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Delete from backend API
          const response = await accountingAPI.deleteTransaction(transactionId);

          if (response.success) {
            // Find the transaction to be deleted (for notification)
            const transactionToDelete = transactions.find(
              (t) => t.id === transactionId
            );
            const transactionDesc = transactionToDelete
              ? transactionToDelete.description ||
                `${transactionToDelete.transactionType} transaction`
              : "transaction";

            // Update local state
            setTransactions(prevTransactions =>
              prevTransactions.filter((t) => t.id !== transactionId)
            );

            // Show success notification
            import("../../utils/toastNotification.js").then(({ showToast }) => {
              showToast(
                `Transaction "${transactionDesc}" deleted successfully`,
                "success"
              );
            });

            // Add to processing log
            addProcessingLog(`Deleted transaction: ${transactionDesc}`, "info");
          } else {
            throw new Error(response.message || "Failed to delete transaction");
          }
        } catch (error) {
          console.error("Failed to delete transaction:", error);

          // Show error toast
          import("../../utils/toastNotification").then(({ showToast }) => {
            showToast(
              `Failed to delete transaction: ${error.message}`,
              "error"
            );
          });

          // Add to processing log
          addProcessingLog(
            `Failed to delete transaction: ${error.message}`,
            "error"
          );
        }
      }
    });
  };

  const handleDeleteAllTransactions = async () => {
    if (transactions.length === 0) {
      // Import and use the toast notification
      import("../../utils/toastNotification").then(({ showToast }) => {
        showToast("No transactions to delete", "info");
      });
      return;
    }

    Swal.fire({
      title: "Delete All Transactions?",
      text: "This will permanently delete ALL transactions. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete all!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Get the count for the notification
          const count = transactions.length;

          // IMMEDIATELY show a loading dialog that can't be dismissed
          Swal.fire({
            title: "Deleting Transactions...",
            html: `
              <div class="text-center">
                <div class="mb-3">Deleting ${count} transactions</div>
                <div class="progress-bar-container" style="height: 10px; background-color: #333; border-radius: 5px; overflow: hidden;">
                  <div id="delete-progress-bar" style="height: 100%; width: 0%; background-color: #dc3545; transition: width 0.3s;"></div>
                </div>
                <div id="delete-progress-text" class="mt-2">Starting deletion...</div>
              </div>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              const progressBar = document.getElementById(
                "delete-progress-bar"
              );
              const progressText = document.getElementById(
                "delete-progress-text"
              );

              // Start with animation to show it's working
              progressBar.style.width = "5%";
              progressText.textContent = "Preparing to delete...";
            },
          });

          // Wait a moment to show the dialog
          await new Promise((resolve) => setTimeout(resolve, 300));

          const progressBar = document.getElementById("delete-progress-bar");
          const progressText = document.getElementById("delete-progress-text");

          // Delete all transactions from backend
          const deletePromises = transactions.map(async (transaction) => {
            try {
              await accountingAPI.deleteTransaction(transaction.id);
              return true;
            } catch (error) {
              console.error(`Failed to delete transaction ${transaction.id}:`, error);
              return false;
            }
          });

          // Process in batches to update the UI
          const batchSize = 10;
          const batches = Math.ceil(count / batchSize);

          // Process in batches
          for (let i = 0; i < batches; i++) {
            const batch = deletePromises.slice(i * batchSize, (i + 1) * batchSize);
            await Promise.all(batch);

            // Update progress
            const progress = 5 + Math.round(((i + 1) / batches) * 95);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Deleting transactions (${Math.min(
              (i + 1) * batchSize,
              count
            )}/${count})`;

            // Small delay to keep UI responsive
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Final update
          progressBar.style.width = "100%";
          progressText.textContent = `Deleted ${count} transactions successfully!`;

          // Refresh transactions from backend
          await loadTransactions();

          // Close the loading dialog after a short delay
          setTimeout(() => {
            Swal.close();

            // Show success notification
            import("../../utils/toastNotification").then(({ showToast }) => {
              showToast(
                `Successfully deleted ${count} transactions`,
                "success"
              );
            });
          }, 1000);

          // Add to processing log
          addProcessingLog(
            `Deleted ${count} transactions from database`,
            "info"
          );
        } catch (error) {
          console.error("Failed to delete all transactions:", error);

          // Show error toast
          import("../../utils/toastNotification").then(({ showToast }) => {
            showToast(
              `Failed to delete transactions: ${error.message}`,
              "error"
            );
          });

          // Add to processing log
          addProcessingLog(
            `Failed to delete transactions: ${error.message}`,
            "error"
          );
        }
      }
    });
  };

  const handleExportTransactions = () => {
    // Create CSV content
    const headers = [
      "Date",
      "Type",
      "Description",
      "Category",
      "Amount",
      "Payment Method",
      "Reference",
      "Tax Deductible",
      "Source File",
    ];
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [
          t.date || "",
          t.transactionType || "",
          `"${(t.description || "").replace(/"/g, '""')}"`, // Escape quotes in description
          t.category || "",
          t.amount || 0,
          t.paymentMethod || "",
          t.reference || "",
          t.taxDeductible ? "Yes" : "No",
          t.sourceFile || "Manual Entry",
        ].join(",")
      ),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Processing log functions
  const addProcessingLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLogs((prev) => [...prev, { message, type, timestamp }]);

    // Show the log window if it's not already visible
    if (!showProcessingLog) {
      setShowProcessingLog(true);
    }
  };

  const clearProcessingLogs = () => {
    setProcessingLogs([]);
  };

  const closeProcessingLog = () => {
    setShowProcessingLog(false);
    clearProcessingLogs();
  };

  const toggleMinimizeProcessingLog = () => {
    setMinimizeProcessingLog((prev) => !prev);
  };

  // Helper function to check if two transactions are duplicates
  function areTransactionsDuplicate(t1, t2) {
    // Check if key fields match
    return (
      t1.date === t2.date &&
      Math.abs(parseFloat(t1.amount) - parseFloat(t2.amount)) < 0.01 && // Allow for small floating point differences
      t1.description === t2.description &&
      t1.transactionType === t2.transactionType
    );
  }

  // Helper function to remove duplicate transactions from an array
  function removeDuplicateTransactions(transactions) {
    const uniqueTransactions = [];

    for (const transaction of transactions) {
      // Check if this transaction is a duplicate of any we've already added
      const isDuplicate = uniqueTransactions.some((existingTransaction) =>
        areTransactionsDuplicate(existingTransaction, transaction)
      );

      // If it's not a duplicate, add it to our unique list
      if (!isDuplicate) {
        uniqueTransactions.push(transaction);
      }
    }

    return uniqueTransactions;
  }

  // Load transactions from backend API
  async function loadTransactions() {
    try {
      console.log("Loading transactions from backend API...");
      const response = await accountingAPI.getTransactions();
      console.log("Transactions loaded from API:", response);

      if (response.success && response.transactions && response.transactions.length > 0) {
        console.log(`Setting ${response.transactions.length} transactions from API`);

        // Format transactions to ensure they match our expected structure
        const formattedTransactions = response.transactions.map((t) => ({
          id: t.id,
          transactionType: t.type,
          amount: parseFloat(t.amount || "0"),
          date: t.date || "",
          description: t.description || "",
          category: t.category || null,
          paymentMethod: t.payment_method || null,
          reference: t.reference || null,
          taxDeductible: !!t.tax_deductible,
          sourceFile: t.source_file || null,
          timestamp: t.created_at || new Date().toISOString(),
        }));

        // Remove any duplicate transactions
        const uniqueTransactions = removeDuplicateTransactions(formattedTransactions);

        if (uniqueTransactions.length < formattedTransactions.length) {
          console.log(
            `Removed ${formattedTransactions.length - uniqueTransactions.length} duplicate transactions`
          );
        }

        console.log("Formatted transactions:", uniqueTransactions);
        setTransactions(uniqueTransactions);
        onLoadTransactions?.(uniqueTransactions);
      } else {
        console.log("No transactions found in API");
        setTransactions([]);
        onLoadTransactions?.([]);
      }
    } catch (error) {
      console.error("Failed to load transactions from API:", error);
      addProcessingLog(
        `Failed to load transactions from API: ${error.message}`,
        "error"
      );

      // Fallback to localStorage if API fails
      try {
        console.log("Falling back to localStorage...");
        const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
        if (storedTransactions && storedTransactions.length > 0) {
          const formattedTransactions = storedTransactions.map((t) => ({
            id: t.id,
            transactionType: t.transactionType,
            amount: typeof t.amount === "number" ? t.amount : parseFloat(t.amount || "0"),
            date: t.date || "",
            description: t.description || "",
            category: t.category || null,
            paymentMethod: t.paymentMethod || null,
            reference: t.reference || null,
            taxDeductible: !!t.taxDeductible,
            sourceFile: t.sourceFile || null,
            timestamp: t.timestamp || new Date().toISOString(),
          }));

          const uniqueTransactions = removeDuplicateTransactions(formattedTransactions);
          setTransactions(uniqueTransactions);
          onLoadTransactions?.(uniqueTransactions);
          addProcessingLog("Loaded transactions from localStorage (fallback)", "info");
        }
      } catch (localError) {
        console.error("Failed to load from localStorage:", localError);
        setTransactions([]);
        onLoadTransactions?.([]);
      }
    }
  }

  // Render the content based on active tab
  return (
    <>
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-950">
        {activeMainCategory === "accountant" && (
          <>
            {activeSubTab === "data-input" && (
              <DataInput
                onFileUpload={handleFileUpload}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                dragActive={dragActive}
                files={files}
                isLoading={isLoading}
                handleFileDownload={handleFileDownload}
                handleFileProcessing={handleFileProcessing}
                handleFileDelete={handleFileDelete}
                handleProcessAllFiles={handleProcessAllFiles}
                getFileIcon={getFileIcon}
                analyzingFile={analyzingFile}
                errorMessage={errorMessage}
                fileTransferProgress={fileTransferProgress}
                onSaveManualData={handleSaveManualData}
              />
            )}

            {activeSubTab === "log-trails" && (
              <LogTrails
                transactions={transactions}
                onViewTransaction={handleViewTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onExportTransactions={handleExportTransactions}
                onDeleteAllTransactions={handleDeleteAllTransactions}
              />
            )}

            {activeSubTab === "workspace" && (
              <Workspace
                files={files}
                handleFileDownload={handleFileDownload}
                handleFileProcessing={handleFileProcessing}
                handleFileDelete={handleFileDelete}
                analyzingFile={analyzingFile}
              />
            )}

            {activeSubTab === "validation" && (
              <Validation
                transactions={transactions}
                onViewTransaction={handleViewTransaction}
                onExportTransactions={handleExportTransactions}
                files={files}
                handleFileDownload={handleFileDownload}
              />
            )}

            {activeSubTab === "analysis" && (
              <Analysis transactions={transactions} />
            )}

            {activeSubTab === "reports" && (
              <Reports
                transactions={transactions}
                files={files}
                handleFileDownload={handleFileDownload}
                handleFileDelete={handleFileDelete}
              />
            )}

            {activeSubTab === "recommendations" && (
              <Recommendations transactions={transactions} />
            )}
          </>
        )}

        {activeMainCategory === "advisor" && (
          <>
            {activeSubTab === "financial-planning" && (
              <FinancialPlanning
                transactions={transactions}
                isLoading={isLoading}
              />
            )}
            {activeSubTab === "investment" && (
              <Investment
                transactions={transactions}
                isLoading={isLoading}
              />
            )}
            {activeSubTab === "tax-strategy" && (
              <TaxStrategy
                transactions={transactions}
                isLoading={isLoading}
              />
            )}
            {["financial-planning", "investment", "tax-strategy"].indexOf(
              activeSubTab
            ) === -1 && (
              <div className="flex items-center justify-center h-64 bg-gray-900 border border-blue-900/30 rounded-lg">
                <div className="text-center">
                  <Users size={12} />
                  <h3 className="text-xl font-medium text-white mb-2">
                    Advisor
                  </h3>
                  <p className="text-gray-400">
                    Coming Soon
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={handleCloseTransactionDetails}
          onDownloadPdf={handleFileDownload}
        />
      )}

      {/* Processing Log */}
      <ProcessingLog
        logs={processingLogs}
        visible={showProcessingLog}
        onClose={closeProcessingLog}
        onMinimize={toggleMinimizeProcessingLog}
        minimized={minimizeProcessingLog}
      />
    </>
  );
}
