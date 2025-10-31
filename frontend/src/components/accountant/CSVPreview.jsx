import React, { useState, useEffect } from "react";
import { Skeleton } from "../ui/Skeleton";

const CSVPreview = ({ url }) => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      console.error("No URL provided to CSVPreview component");
      setError("No URL provided for CSV preview");
      setLoading(false);
      return;
    }

    console.log("CSVPreview: Fetching CSV from URL:", url);

    const fetchCSV = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch the CSV data from the URL
        console.log("CSVPreview: Starting fetch request");
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        console.log("CSVPreview: Fetch successful, getting text");
        const text = await response.text();
        console.log("CSVPreview: CSV text received, length:", text.length);

        // Log a sample of the CSV data for debugging
        if (text.length > 0) {
          console.log(
            "CSVPreview: CSV sample:",
            text.substring(0, 100) + "..."
          );
        } else {
          console.warn("CSVPreview: Received empty CSV data");
        }

        parseCSV(text);
      } catch (err) {
        console.error("CSVPreview: Error fetching CSV:", err);
        setError(`Failed to load CSV: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCSV();
  }, [url]);

  const parseCSV = (text) => {
    try {
      console.log("CSVPreview: Starting CSV parsing");

      if (!text || text.trim() === "") {
        console.error("CSVPreview: Empty text provided to CSV parser");
        setError("The CSV file appears to be empty");
        return;
      }

      // Simple CSV parser
      const lines = text.split(/\r?\n/);
      console.log(`CSVPreview: Found ${lines.length} lines in CSV`);

      const result = [];

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Simple parsing for CSV - split by commas
        // This is a simplified version that doesn't handle all CSV edge cases
        const row = line.split(",").map((cell) => cell.trim());

        if (row.length > 0) {
          result.push(row);
        }
      }

      console.log(`CSVPreview: Parsed ${result.length} rows of data`);

      if (result.length === 0) {
        console.warn("CSVPreview: No data rows found in CSV");
        setError("No data found in the CSV file");
        return;
      }

      // Log the first row (headers) for debugging
      if (result.length > 0) {
        console.log("CSVPreview: Headers:", result[0]);
      }

      // Log data sample for debugging
      if (result.length > 1) {
        console.log("CSVPreview: First data row:", result[1]);
      }

      setCsvData(result);
    } catch (err) {
      console.error("CSVPreview: Error parsing CSV:", err);
      setError(`Failed to parse CSV: ${err.message}`);
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

  if (csvData.length === 0) {
    return (
      <div className="p-4 text-gray-600">
        <p>No data found in CSV file.</p>
      </div>
    );
  }

  // Determine if first row is header
  const headers = csvData[0];
  const dataRows = csvData.slice(1);

  return (
    <div className="overflow-x-auto">
      <div className="p-2 bg-gray-100 border-b border-gray-300 text-sm text-gray-600">
        <span className="font-medium">{csvData.length} rows</span> •
        <span className="ml-2 font-medium">{headers.length} columns</span>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {/* Row number column */}
            <th
              scope="col"
              className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 border-r border-gray-200"
            >
              #
            </th>
            {/* Data columns */}
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dataRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-blue-50"
              }
            >
              {/* Row number */}
              <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-400 bg-gray-100 border-r border-gray-200 text-center">
                {rowIndex + 1}
              </td>
              {/* Data cells */}
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-700">
                  {cell}
                </td>
              ))}
              {/* Add empty cells if row has fewer cells than header */}
              {row.length < headers.length &&
                Array(headers.length - row.length)
                  .fill(0)
                  .map((_, i) => (
                    <td
                      key={`empty-${rowIndex}-${i}`}
                      className="px-4 py-2 text-sm text-gray-300 italic"
                    >
                      (empty)
                    </td>
                  ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CSVPreview;
