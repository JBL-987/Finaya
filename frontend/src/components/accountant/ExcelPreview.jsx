import React, { useState, useEffect } from "react";
import { Skeleton } from "../ui/Skeleton";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

const ExcelPreview = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [sheetNames, setSheetNames] = useState([]);
  const [workbook, setWorkbook] = useState(null);

  useEffect(() => {
    if (!url) {
      console.error("No URL provided to ExcelPreview component");
      setError("No URL provided for Excel preview");
      setLoading(false);
      return;
    }

    console.log("ExcelPreview: Fetching Excel file from URL:", url);

    const fetchExcel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch the Excel data from the URL
        console.log("ExcelPreview: Starting fetch request");
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
        }

        console.log("ExcelPreview: Fetch successful, getting array buffer");
        const arrayBuffer = await response.arrayBuffer();
        console.log(
          "ExcelPreview: Excel data received, size:",
          arrayBuffer.byteLength
        );

        try {
          // Use SheetJS to parse the Excel file
          console.log("ExcelPreview: Parsing Excel data with SheetJS");
          const data = new Uint8Array(arrayBuffer);
          const wb = XLSX.read(data, { type: "array" });

          // Get sheet names
          const sheets = wb.SheetNames;
          console.log("ExcelPreview: Found sheets:", sheets);

          if (sheets.length === 0) {
            throw new Error("No sheets found in Excel file");
          }

          setWorkbook(wb);
          setSheetNames(sheets);

          // Set the first sheet as active by default
          setActiveSheet(0);

          // Convert the first sheet to JSON
          const firstSheetName = sheets[0];
          const worksheet = wb.Sheets[firstSheetName];

          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          console.log(
            "ExcelPreview: Parsed data from first sheet:",
            jsonData.length,
            "rows"
          );

          setExcelData(jsonData);
          setLoading(false);
        } catch (parseError) {
          console.error("ExcelPreview: Error parsing Excel data:", parseError);
          throw new Error(`Failed to parse Excel file: ${parseError.message}`);
        }
      } catch (err) {
        console.error("ExcelPreview: Error fetching Excel:", err);
        setError(`Failed to load Excel file: ${err.message}`);
        setLoading(false);
      }
    };

    fetchExcel();
  }, [url]);

  // Function to handle sheet changes
  const handleSheetChange = (index) => {
    if (!workbook || index >= sheetNames.length) return;

    try {
      setActiveSheet(index);
      const sheetName = sheetNames[index];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(
        `ExcelPreview: Changed to sheet "${sheetName}":`,
        jsonData.length,
        "rows"
      );

      setExcelData(jsonData);
    } catch (err) {
      console.error("ExcelPreview: Error changing sheet:", err);
      setError(`Failed to load sheet: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-3 w-32 ml-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  // Check if we have data
  const hasData = excelData && excelData.length > 0;
  const hasHeaders = hasData && excelData[0] && excelData[0].length > 0;
  const dataRows = hasData ? excelData.slice(1) : [];

  return (
    <div className="overflow-x-auto">
      {/* Sheet tabs */}
      {sheetNames.length > 0 && (
        <div className="flex border-b border-gray-300 bg-gray-100 overflow-x-auto">
          {sheetNames.map((name, index) => (
            <button
              key={index}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeSheet === index
                  ? "bg-white border-t border-l border-r border-gray-300 border-b-0 text-blue-600"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => handleSheetChange(index)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Excel data table */}
      <div className="bg-white">
        {hasData ? (
          <div>
            {/* Sheet info */}
            <div className="p-2 bg-gray-100 border-b border-gray-300 text-sm text-gray-600 flex justify-between">
              <div>
                <span className="font-medium">{sheetNames[activeSheet]}</span>
                <span className="mx-2">•</span>
                <span>{excelData.length} rows</span>
                {hasHeaders && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{excelData[0].length} columns</span>
                  </>
                )}
              </div>
              <div className="text-blue-600 text-xs flex items-center">
                <FileSpreadsheet size={14} className="mr-1" />
                Powered by SheetJS
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto" style={{ maxHeight: "500px" }}>
              <table className="min-w-full border-collapse">
                {hasHeaders && (
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {/* Row number header */}
                      <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 border border-gray-200 text-center sticky left-0 z-10">
                        #
                      </th>

                      {/* Column headers */}
                      {excelData[0].map((header, index) => (
                        <th
                          key={index}
                          className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200"
                        >
                          {header !== undefined && header !== null
                            ? header.toString()
                            : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}

                <tbody>
                  {/* If no headers, show first row as data */}
                  {!hasHeaders && hasData && (
                    <tr className="bg-white">
                      <td className="px-2 py-2 text-xs text-gray-400 bg-gray-100 border border-gray-200 text-center sticky left-0 z-10">
                        1
                      </td>
                      {excelData[0].map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-3 py-2 text-sm text-gray-700 border border-gray-200"
                        >
                          {cell !== undefined && cell !== null
                            ? cell.toString()
                            : ""}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Data rows */}
                  {dataRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {/* Row number */}
                      <td className="px-2 py-2 text-xs text-gray-400 bg-gray-100 border border-gray-200 text-center sticky left-0 z-10">
                        {hasHeaders ? rowIndex + 2 : rowIndex + 2}
                      </td>

                      {/* Row cells */}
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-3 py-2 text-sm text-gray-700 border border-gray-200"
                        >
                          {cell !== undefined && cell !== null
                            ? cell.toString()
                            : ""}
                        </td>
                      ))}

                      {/* Add empty cells if row has fewer cells than header */}
                      {hasHeaders &&
                        row.length < excelData[0].length &&
                        Array(excelData[0].length - row.length)
                          .fill(0)
                          .map((_, i) => (
                            <td
                              key={`empty-${rowIndex}-${i}`}
                              className="px-3 py-2 text-sm text-gray-300 italic border border-gray-200"
                            >
                              (empty)
                            </td>
                          ))}
                    </tr>
                  ))}

                  {/* Show message if no data rows */}
                  {dataRows.length === 0 && hasHeaders && (
                    <tr>
                      <td
                        colSpan={excelData[0].length + 1}
                        className="px-3 py-4 text-sm text-gray-500 text-center border border-gray-200"
                      >
                        No data in this sheet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Fallback if no data could be parsed
          <div className="p-6 text-center">
            <div className="bg-blue-50 p-6 rounded-lg mb-4 inline-block">
              <FileSpreadsheet
                size={48}
                className="text-blue-500 mx-auto mb-4"
              />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">
              Excel Preview
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No data could be extracted from this Excel file. Please download
              the file to view it in Microsoft Excel or another spreadsheet
              application.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelPreview;
