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
} from "lucide-react";
import FilePreview from "./FilePreview";

const Reports = ({
  transactions,
  files,
  handleFileDownload,
  handleFileDelete,
}) => {
  const normalizedTransactions = Array.isArray(transactions)
    ? transactions
    : [];
  const normalizedFiles = Array.isArray(files) ? files : [];

  const [generatedReports, setGeneratedReports] = useState({});
  const [previewFile, setPreviewFile] = useState(null);

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

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);

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

    setGeneratedReports((prev) => ({
      ...prev,
      [reportType]: { name: fileName, url: pdfUrl, blob: pdfBlob },
    }));

    setFolderStructure((prev) => ({
      ...prev,
      Financial_Reports: {
        ...prev.Financial_Reports,
        files: [
          ...prev.Financial_Reports.files.filter((f) => f.name !== fileName),
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
                          <FileText size={16} className="mr-2 text-white" />
                          <span>{file.name}</span>
                        </div>
                        <div className="flex space-x-2">
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
