import React, { useState, useRef, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Download,
  FileText,
  BarChart3,
  Receipt,
  Eye,
  Trash2,
  MoveHorizontal,
  Brain,
  Sparkles,
} from "lucide-react";
import FilePreview from "./FilePreview";
import { Skeleton } from "../ui/Skeleton";
import { accountingAPI, reportsAPI } from "../../services/api";
import { useCurrency } from "../../contexts/CurrencyContext";
import { formatCurrency as formatCurrencyService } from "../../services/currencies";

const Reports = ({
  transactions,
  files,
  handleFileDownload,
  handleFileDelete,
}) => {
  const { selectedCurrency } = useCurrency();
  const normalizedTransactions = Array.isArray(transactions)
    ? transactions
    : [];
  const normalizedFiles = Array.isArray(files) ? files : [];

  const [generatedReports, setGeneratedReports] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [categorizingFiles, setCategorizingFiles] = useState(new Set());
  const [categorizedFiles, setCategorizedFiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [folderStructure, setFolderStructure] = useState({
    Financial_Reports: {
      expanded: false,
      description: "Generated reports",
      files: [],
    },
    Tax_Reports: {
      expanded: false,
      description: "Generated tax documents",
      files: [],
    },
    Uploaded_Files: {
      expanded: true,
      description: "User uploaded documents",
      files: normalizedFiles,
    },
  });

  useEffect(() => {
    setFolderStructure((prev) => ({
      ...prev,
      Uploaded_Files: { ...prev.Uploaded_Files, files: normalizedFiles },
    }));
  }, [files]);

  // Set loading to false after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (value) => formatCurrencyService(value, selectedCurrency);

  const processFinancialData = () => {
    const income = normalizedTransactions.filter(
      (t) => t.transactionType === "income"
    );
    const expenses = normalizedTransactions.filter(
      (t) => t.transactionType === "expense"
    );
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netIncome };
  };

  const generateReport = async (reportType) => {
    const financialData = processFinancialData();

    // Generate AI-powered report content
    let aiContent = "";
    try {
      const aiResponse = await fetch('/api/v1/accounting/ai/financial-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goals: [`Generate ${reportType} report`]
        })
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        if (aiResult.success && aiResult.recommendations) {
          aiContent = aiResult.recommendations;
        }
      }
    } catch (error) {
      console.error('AI report generation failed:', error);
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255); // white
    doc.text(`${reportType.replace(/([A-Z])/g, ' $1').toUpperCase()} REPORT`, 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, 25);
    doc.text(`AI-Powered Financial Analysis`, 15, 33);

    // Financial Summary Table
    autoTable(doc, {
      startY: 40,
      head: [["Financial Summary", "Amount"]],
      body: [
        ["Total Income", formatCurrency(financialData.totalIncome)],
        ["Total Expenses", formatCurrency(financialData.totalExpenses)],
        ["Net Income", formatCurrency(financialData.netIncome)],
        ["Transaction Count", normalizedTransactions.length.toString()],
      ],
      styles: { fontSize: 10 },
      theme: "grid",
    });

    let yPosition = doc.lastAutoTable.finalY + 20;

    // AI Recommendations Section
    if (aiContent) {
      doc.setFontSize(14);
      doc.text("AI Analysis & Recommendations", 15, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const splitRecommendations = doc.splitTextToSize(JSON.stringify(aiContent, null, 2), 180);
      doc.text(splitRecommendations, 15, yPosition);
    }

    // Transaction Details Table
    if (normalizedTransactions.length > 0) {
      yPosition += 30;
      doc.setFontSize(14);
      doc.text("Transaction Details", 15, yPosition);
      yPosition += 10;

      const transactionData = normalizedTransactions.slice(0, 50).map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description || 'N/A',
        t.category || 'Uncategorized',
        formatCurrency(t.amount),
        t.transactionType
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Date", "Description", "Category", "Amount", "Type"]],
        body: transactionData,
        styles: { fontSize: 8 },
        theme: "grid",
      });
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const fileName = `${reportType}_AI_Report_${new Date().toISOString().split('T')[0]}.pdf`;

    // Save report to database based on type
    try {
      const reportData = {
        report_type: reportType,
        file_name: fileName,
        content: {
          financial_summary: financialData,
          ai_analysis: aiContent,
          transaction_count: normalizedTransactions.length,
          generated_date: new Date().toISOString(),
          report_metadata: {
            total_income: financialData.totalIncome,
            total_expenses: financialData.totalExpenses,
            net_income: financialData.netIncome
          }
        },
        pdf_data: await pdfBlob.arrayBuffer(), // Convert blob to ArrayBuffer for storage
        status: 'generated'
      };

      // Determine which API to use based on report type
      const isTaxReport = ['quarterlyTax', 'annualTax', 'salesTax'].includes(reportType);

      if (isTaxReport) {
        reportData.tax_period = reportType === 'quarterlyTax' ? 'quarterly' :
                               reportType === 'annualTax' ? 'annual' : 'monthly';
        await reportsAPI.createTaxReport(reportData);
      } else {
        await reportsAPI.createFinancialReport(reportData);
      }

      console.log('Report saved to database successfully');
    } catch (error) {
      console.error('Error saving report to database:', error);
    }

    setGeneratedReports((prev) => ({
      ...prev,
      [reportType]: { name: fileName, url: pdfUrl, blob: pdfBlob },
    }));

    // Determine target folder based on report type
    const isTaxReport = ['quarterlyTax', 'annualTax', 'salesTax'].includes(reportType);
    const targetFolder = isTaxReport ? 'Tax_Reports' : 'Financial_Reports';

    setFolderStructure((prev) => ({
      ...prev,
      [targetFolder]: {
        ...prev[targetFolder],
        files: [
          ...prev[targetFolder].files.filter((f) => f.name !== fileName),
          { name: fileName, url: pdfUrl, blob: pdfBlob, generated: true },
        ],
      },
    }));
  };

  const handleFileAction = (file, action) => {
    if (file.generated) {
      if (action === "delete") {
        setFolderStructure((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((folder) => {
            updated[folder].files = updated[folder].files.filter(
              (f) => f.name !== file.name
            );
          });
          return updated;
        });
      } else if (action === "download") {
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.name;
        link.click();
      }
    } else {
      if (action === "delete") handleFileDelete(file.name);
      else if (action === "download") handleFileDownload(file.name);
    }
  };

  const openFilePreview = async (file) => {
    if (file.generated) setPreviewFile({ ...file, type: "pdf" });
    else {
      const blob = await handleFileDownload(file.name, true);
      setPreviewFile({
        name: file.name,
        blob,
        type: file.name.split(".").pop().toLowerCase(),
      });
    }
  };

  // AI Document Categorization
  const categorizeDocument = async (file) => {
    if (categorizingFiles.has(file.name)) return;

    setCategorizingFiles(prev => new Set(prev).add(file.name));

    try {
      // Get file content for AI analysis
      const blob = await handleFileDownload(file.name, true);
      const fileExtension = file.name.split(".").pop().toLowerCase();

      // Convert blob to text (for supported formats)
      let documentContent = "";
      if (fileExtension === "txt") {
        documentContent = await blob.text();
      } else if (fileExtension === "csv") {
        documentContent = await blob.text();
      } else {
        // For binary files, just use filename and extension
        documentContent = `File: ${file.name}, Type: ${fileExtension}`;
      }

      // Call AI categorization API using reportsAPI
      const result = await reportsAPI.categorizeDocument({
        document_name: file.name,
        document_content: documentContent.substring(0, 2000), // Limit content
        document_type: fileExtension,
      });

      setCategorizedFiles(prev => ({
        ...prev,
        [file.name]: result
      }));

      // Auto-move file to appropriate folder based on categorization
      if (result.category === "financial_report") {
        moveFileToFolder(file.name, "Financial_Reports");
      } else if (result.category === "tax_report") {
        moveFileToFolder(file.name, "Tax_Reports");
      }
    } catch (error) {
      console.error("Document categorization failed:", error);
    } finally {
      setCategorizingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.name);
        return newSet;
      });
    }
  };

  const moveFileToFolder = (fileName, targetFolder) => {
    setFolderStructure(prev => {
      // Find source folder
      let sourceFolder = null;
      let fileToMove = null;

      Object.entries(prev).forEach(([folderName, folder]) => {
        const file = folder.files.find(f => f.name === fileName);
        if (file) {
          sourceFolder = folderName;
          fileToMove = file;
        }
      });

      if (!sourceFolder || !fileToMove) return prev;

      // Remove from source and add to target
      const updated = { ...prev };
      updated[sourceFolder] = {
        ...updated[sourceFolder],
        files: updated[sourceFolder].files.filter(f => f.name !== fileName)
      };
      updated[targetFolder] = {
        ...updated[targetFolder],
        files: [...updated[targetFolder].files, fileToMove]
      };

      return updated;
    });
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    const categorization = categorizedFiles[fileName];

    if (categorization) {
      if (categorization.category === "financial_report") {
        return <BarChart3 size={16} className="text-blue-400" />;
      } else if (categorization.category === "tax_report") {
        return <Receipt size={16} className="text-green-400" />;
      }
    }

    if (["pdf", "doc", "docx", "txt"].includes(extension)) {
      return <FileText size={16} className="text-blue-400" />;
    } else if (["xls", "xlsx", "csv"].includes(extension)) {
      return <BarChart3 size={16} className="text-green-400" />;
    } else {
      return <File size={16} className="text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 text-white">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <Skeleton className="h-4 w-32 bg-gray-700" />
        </div>

        {/* Buttons Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col items-center">
              <Skeleton className="h-6 w-6 mb-2 bg-gray-600" />
              <Skeleton className="h-4 w-20 bg-gray-600" />
            </div>
          ))}
        </div>

        {/* File Explorer Skeleton */}
        <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
          <Skeleton className="h-6 w-32 mb-4 bg-gray-700" />
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {Array.from({ length: 3 }).map((_, folderIndex) => (
              <div key={folderIndex} className="border-b border-gray-700 last:border-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2 bg-gray-600" />
                    <Skeleton className="h-4 w-4 mr-2 bg-gray-600" />
                    <Skeleton className="h-4 w-32 bg-gray-600" />
                    <Skeleton className="h-3 w-12 ml-2 bg-gray-600" />
                  </div>
                  <Skeleton className="h-3 w-40 bg-gray-600" />
                </div>
                <div className="bg-gray-800/50 pl-8">
                  {Array.from({ length: 2 }).map((_, fileIndex) => (
                    <div key={fileIndex} className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2 bg-gray-600" />
                        <Skeleton className="h-4 w-48 bg-gray-600" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-4 w-4 bg-gray-600" />
                        <Skeleton className="h-4 w-4 bg-gray-600" />
                        <Skeleton className="h-4 w-4 bg-gray-600" />
                        <Skeleton className="h-4 w-4 bg-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">
        Reports Dashboard
      </h1>

      {/* Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          ["Balance Sheet", "balanceSheet"],
          ["Income Statement", "incomeStatement"],
          ["Cash Flow", "cashFlowStatement"],
          ["Quarterly Tax", "quarterlyTax"],
          ["Annual Tax", "annualTax"],
          ["Sales Tax", "salesTax"],
        ].map(([label, type]) => (
        <button
            key={type}
            onClick={() => generateReport(type)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold p-4 rounded-lg flex flex-col items-center transition shadow-md"
          >
          <FileText size={24} className="mb-2 text-white" />
          <span>{label}</span>
        </button>

        ))}
      </div>

      {/* File Explorer */}
      <div className="bg-gray-900 rounded-lg p-6 shadow-lg text-white">
        <h2 className="text-xl font-bold mb-4 text-white">File Explorer</h2>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {Object.entries(folderStructure).map(([folderName, folder]) => (
            <div key={folderName} className="border-b border-gray-700 last:border-0">
              <div
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-700 cursor-pointer"
                onClick={() =>
                  setFolderStructure((prev) => ({
                    ...prev,
                    [folderName]: {
                      ...prev[folderName],
                      expanded: !prev[folderName].expanded,
                    },
                  }))
                }
              >
                <div className="flex items-center">
                  {folder.expanded ? (
                    <ChevronDown size={16} className="text-white mr-2" />
                  ) : (
                    <ChevronRight size={16} className="text-white mr-2" />
                  )}
                  <Folder size={16} className="text-white mr-2" />
                  <span className="font-medium text-white">
                    {folderName.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({folder.files.length} files)
                  </span>
                </div>
                <span className="text-sm text-gray-400">{folder.description}</span>
              </div>

              {folder.expanded && (
                <div className="bg-gray-800/50 pl-8">
                  {folder.files.length > 0 ? (
                    folder.files.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-700"
                      >
                        <div className="flex items-center text-white">
                          {getFileIcon(file.name)}
                          <span className="ml-2">{file.name}</span>
                          {categorizedFiles[file.name] && (
                            <span className="ml-2 text-xs px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full">
                              {categorizedFiles[file.name].subcategory || categorizedFiles[file.name].category}
                            </span>
                          )}
                          {categorizingFiles.has(file.name) && (
                            <span className="ml-2 text-xs px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded-full flex items-center">
                              <Brain size={12} className="mr-1" />
                              Analyzing...
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {!categorizedFiles[file.name] && !categorizingFiles.has(file.name) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                categorizeDocument(file);
                              }}
                              className="text-purple-400 hover:text-purple-300"
                              title="AI Categorize"
                            >
                              <Brain size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openFilePreview(file);
                            }}
                            className="text-white hover:text-gray-300"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction(file, "download");
                            }}
                            className="text-white hover:text-gray-300"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction(file, "delete");
                            }}
                            className="text-white hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      This folder is empty
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={() => {
            const link = document.createElement("a");
            link.href = previewFile.url;
            link.download = previewFile.name;
            link.click();
          }}
        />
      )}
    </div>
  );
};

export default Reports;
