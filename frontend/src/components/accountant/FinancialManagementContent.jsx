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
    addProcessingLog(`Uploading file: ${file.name} for OCR processing...`, "info");
    try {
      const response = await accountingAPI.createTransaction({}, file);
      if (response.success) {
        addProcessingLog(`Successfully processed ${file.name} with OCR.`, "success");
        await loadTransactions(); // Refresh transactions
      } else {
        throw new Error(response.detail || "Failed to process file with OCR.");
      }
    } catch (error) {
      addProcessingLog(`Error processing file ${file.name}: ${error.message}`, "error");
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
    addProcessingLog("Saving manual transaction data...", "info");
    try {
      // Convert date to a full datetime string to match backend schema
      const dataToSend = {
        ...manualData,
        date: new Date(manualData.date).toISOString(),
        type: manualData.transactionType, // Match the 'type' field expected by the backend
      };

      const response = await accountingAPI.createTransaction(dataToSend);
      if (response.success) {
        addProcessingLog("Manual transaction saved successfully.", "success");
        await loadTransactions(); // Refresh transactions
        return true; // Indicate success
      } else {
        throw new Error(response.detail || "Failed to save manual transaction.");
      }
    } catch (error) {
      addProcessingLog(`Failed to save manual data: ${error.message}`, "error");
      return false; // Indicate failure
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
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    addProcessingLog(`Deleting transaction ${transactionId}...`, "info");
    try {
      await accountingAPI.deleteTransaction(transactionId);
      addProcessingLog(`Transaction ${transactionId} deleted successfully.`, "success");
      await loadTransactions(); // Refresh transactions
    } catch (error) {
      addProcessingLog(`Failed to delete transaction ${transactionId}: ${error.message}`, "error");
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (transactions.length === 0) {
      alert("No transactions to delete.");
      return;
    }
    if (!confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) {
      return;
    }

    addProcessingLog("Deleting all transactions...", "info");
    try {
      const deletePromises = transactions.map((t) =>
        accountingAPI.deleteTransaction(t.id)
      );
      await Promise.all(deletePromises);
      addProcessingLog("All transactions deleted successfully.", "success");
      await loadTransactions(); // Refresh transactions
    } catch (error) {
      addProcessingLog(`Failed to delete all transactions: ${error.message}`, "error");
    }
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

  async function loadTransactions() {
    setIsLoading(true);
    try {
      const data = await accountingAPI.getTransactions();
      const formattedTransactions = data.map((t) => ({
        id: t.id,
        transactionType: t.type,
        amount: parseFloat(t.amount || "0"),
        date: t.date || "",
        description: t.description || "",
        category: t.category || "Uncategorized",
        sourceFile: t.source_file || "Manual",
        timestamp: t.created_at || new Date().toISOString(),
      }));
      const uniqueTransactions = removeDuplicateTransactions(formattedTransactions);
      setTransactions(uniqueTransactions);
      onLoadTransactions?.(uniqueTransactions);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      addProcessingLog(`Failed to load transactions: ${error.message}`, "error");
      setTransactions([]); // Clear transactions on error
    } finally {
      setIsLoading(false);
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
