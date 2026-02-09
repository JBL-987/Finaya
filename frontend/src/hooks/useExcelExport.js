import { useState } from 'react';
import * as XLSX from 'xlsx';

export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Format number as currency (Rupiah)
   */
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'Rp 0';
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
  };

  /**
   * Format number with thousand separator
   */
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return Number(value).toLocaleString('id-ID');
  };

  /**
   * Export analysis data to Excel with professional formatting
   */
  const exportToExcel = async (analysisData, filename = 'analysis_report') => {
    setIsExporting(true);
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // ============================================
      // Sheet 1: Summary - Executive Overview
      // ============================================
      const summaryData = [
        ['FINAYA BUSINESS ANALYSIS REPORT'],
        [''],
        ['Analysis Information'],
        ['Location Name', analysisData.locationName || analysisData.name || 'N/A'],
        ['Address', analysisData.locationData?.address || analysisData.location || 'N/A'],
        ['Analysis Date', new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
        ['Report Generated', new Date().toLocaleString('id-ID')],
        [''],
        ['KEY PERFORMANCE METRICS'],
        [''],
        ['Revenue Analysis'],
        ['Total Purchases per Day', formatNumber(analysisData.metrics?.tppd || 0) + ' transactions'],
        ['Daily Revenue', formatCurrency(analysisData.metrics?.dailyRevenue || 0)],
        ['Monthly Revenue', formatCurrency(analysisData.metrics?.monthlyRevenue || 0)],
        ['Yearly Revenue (Projected)', formatCurrency(analysisData.metrics?.yearlyRevenue || 0)],
        [''],
        ['Location Assessment'],
        ['Location Score', (analysisData.metrics?.locationScore || 0) + ' / 10'],
        ['Risk Score', ((analysisData.metrics?.riskScore || 0) * 100).toFixed(1) + '%'],
        ['Confidence Level', analysisData.metrics?.confidenceLevel || 'N/A'],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Apply styles to summary sheet
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 35 }];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

      // ============================================
      // Sheet 2: Technical Analysis
      // ============================================
      const technicalData = [
        ['TECHNICAL BREAKDOWN'],
        [''],
        ['Population & Demographics'],
        ['CGLP Population', formatNumber(analysisData.metrics?.cglp || 0) + ' people'],
        ['Residential Population', formatNumber(analysisData.metrics?.pops || 0) + ' people'],
        [''],
        ['Traffic & Infrastructure'],
        ['Traffic Potential (APT)', formatNumber(analysisData.metrics?.apt || 0) + ' vehicles/day'],
        ['Road Density (PDR)', (analysisData.metrics?.pdr || 0) + ' km/km²'],
        [''],
        ['Area Analysis'],
        ['Analysis Zone Area', (analysisData.locationData?.areaSquareKm || 0).toFixed(4) + ' km²'],
        ['Catchment Radius', '500 meters (default)'],
      ];

      const technicalSheet = XLSX.utils.aoa_to_sheet(technicalData);
      technicalSheet['!cols'] = [{ wch: 35 }, { wch: 30 }];
      
      XLSX.utils.book_append_sheet(workbook, technicalSheet, 'Technical Analysis');

      // ============================================
      // Sheet 3: Financial Projections
      // ============================================
      const financialData = [
        ['FINANCIAL PROJECTIONS'],
        [''],
        ['Revenue Breakdown'],
        ['Period', 'Amount (IDR)'],
        ['Daily Revenue', formatCurrency(analysisData.metrics?.dailyRevenue || 0)],
        ['Weekly Revenue (7 days)', formatCurrency((analysisData.metrics?.dailyRevenue || 0) * 7)],
        ['Monthly Revenue (30 days)', formatCurrency(analysisData.metrics?.monthlyRevenue || 0)],
        ['Quarterly Revenue (90 days)', formatCurrency((analysisData.metrics?.monthlyRevenue || 0) * 3)],
        ['Yearly Revenue (365 days)', formatCurrency(analysisData.metrics?.yearlyRevenue || 0)],
        [''],
        ['Transaction Metrics'],
        ['Purchases per Day', formatNumber(analysisData.metrics?.tppd || 0) + ' transactions'],
        ['Purchases per Month', formatNumber((analysisData.metrics?.tppd || 0) * 30) + ' transactions'],
        ['Purchases per Year', formatNumber((analysisData.metrics?.tppd || 0) * 365) + ' transactions'],
        [''],
        ['Average Transaction'],
        ['Avg Transaction Value', formatCurrency((analysisData.metrics?.dailyRevenue || 0) / (analysisData.metrics?.tppd || 1))],
      ];

      const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
      financialSheet['!cols'] = [{ wch: 30 }, { wch: 35 }];
      
      XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial Projections');

      // ============================================
      // Sheet 4: Risk Analysis
      // ============================================
      const riskData = [
        ['RISK EVALUATION'],
        [''],
        ['Risk Assessment'],
        ['Risk Score', ((analysisData.metrics?.riskScore || 0) * 100).toFixed(1) + '%'],
        ['Risk Category', (analysisData.metrics?.riskScore || 0) > 0.5 ? 'High Risk' : (analysisData.metrics?.riskScore || 0) > 0.3 ? 'Medium Risk' : 'Low Risk'],
        ['Confidence Level', analysisData.metrics?.confidenceLevel || 'N/A'],
        [''],
        ['Model Information'],
        ['Assumptions', analysisData.metrics?.assumptions || 'Standard urban density model applied.'],
        [''],
        ['Risk Interpretation'],
        ['Score Range', 'Meaning'],
        ['0% - 30%', 'Low Risk - High stability and profitability potential'],
        ['31% - 50%', 'Medium Risk - Moderate stability, careful planning needed'],
        ['51% - 100%', 'High Risk - Significant challenges, thorough analysis required'],
      ];

      const riskSheet = XLSX.utils.aoa_to_sheet(riskData);
      riskSheet['!cols'] = [{ wch: 25 }, { wch: 50 }];
      
      XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk Analysis');

      // ============================================
      // Sheet 5: Area Distribution
      // ============================================
      if (analysisData.areaDistribution) {
        const areaData = [
          ['AREA DISTRIBUTION ANALYSIS'],
          [''],
          ['Land Use Breakdown'],
          ['Category', 'Percentage', 'Description'],
          ['Residential Area', (analysisData.areaDistribution.residential || 0) + '%', 'Housing and living spaces'],
          ['Road Network', (analysisData.areaDistribution.road || 0) + '%', 'Streets and transportation infrastructure'],
          ['Open Space', (analysisData.areaDistribution.openSpace || 0) + '%', 'Parks, green areas, and public spaces'],
          [''],
          ['AI Analysis - Area Reasoning'],
          [analysisData.areaDistribution.reasoning || 'N/A'],
          [''],
          ['Impact on Business'],
          ['High Residential % = More potential customers living nearby'],
          ['High Road % = Better accessibility and traffic flow'],
          ['Balanced distribution generally indicates stable commercial area'],
        ];

        const areaSheet = XLSX.utils.aoa_to_sheet(areaData);
        areaSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 45 }];
        
        XLSX.utils.book_append_sheet(workbook, areaSheet, 'Area Distribution');
      }

      // ============================================
      // Sheet 6: AI Strategic Insights (SWOT)
      // ============================================
      if (analysisData.areaDistribution?.swot) {
        const swot = analysisData.areaDistribution.swot;
        const aiData = [
          ['AI STRATEGIC INSIGHTS - SWOT ANALYSIS'],
          [''],
          ['STRENGTHS - Internal Positive Factors'],
        ];

        if (swot.strengths?.length > 0) {
          swot.strengths.forEach((s, idx) => {
            aiData.push([`${idx + 1}.`, s]);
          });
        } else {
          aiData.push(['', 'No strengths identified']);
        }
        
        aiData.push(['']);
        aiData.push(['WEAKNESSES - Internal Negative Factors']);
        
        if (swot.weaknesses?.length > 0) {
          swot.weaknesses.forEach((w, idx) => {
            aiData.push([`${idx + 1}.`, w]);
          });
        } else {
          aiData.push(['', 'No weaknesses identified']);
        }

        aiData.push(['']);
        aiData.push(['OPPORTUNITIES - External Positive Factors']);
        
        if (swot.opportunities?.length > 0) {
          swot.opportunities.forEach((o, idx) => {
            aiData.push([`${idx + 1}.`, o]);
          });
        } else {
          aiData.push(['', 'No opportunities identified']);
        }

        aiData.push(['']);
        aiData.push(['THREATS - External Negative Factors']);
        
        if (swot.threats?.length > 0) {
          swot.threats.forEach((t, idx) => {
            aiData.push([`${idx + 1}.`, t]);
          });
        } else {
          aiData.push(['', 'No threats identified']);
        }

        aiData.push(['']);
        aiData.push(['STRATEGIC RECOMMENDATIONS']);
        aiData.push(['• Leverage strengths to capitalize on opportunities']);
        aiData.push(['• Address weaknesses to mitigate threats']);
        aiData.push(['• Develop contingency plans for identified risks']);
        aiData.push(['• Monitor market trends and adjust strategy accordingly']);

        const aiSheet = XLSX.utils.aoa_to_sheet(aiData);
        aiSheet['!cols'] = [{ wch: 8 }, { wch: 70 }];
        
        XLSX.utils.book_append_sheet(workbook, aiSheet, 'AI Strategic Insights');
      }

      // ============================================
      // Sheet 7: Raw Data
      // ============================================
      const rawData = [
        ['RAW DATA EXPORT'],
        [''],
        ['All Metrics (Unformatted)'],
        ['Metric', 'Value'],
        ['TPPD', analysisData.metrics?.tppd || 0],
        ['Daily Revenue', analysisData.metrics?.dailyRevenue || 0],
        ['Monthly Revenue', analysisData.metrics?.monthlyRevenue || 0],
        ['Yearly Revenue', analysisData.metrics?.yearlyRevenue || 0],
        ['Location Score', analysisData.metrics?.locationScore || 0],
        ['Risk Score (decimal)', analysisData.metrics?.riskScore || 0],
        ['CGLP', analysisData.metrics?.cglp || 0],
        ['POPS', analysisData.metrics?.pops || 0],
        ['APT', analysisData.metrics?.apt || 0],
        ['PDR', analysisData.metrics?.pdr || 0],
        ['Area (km²)', analysisData.locationData?.areaSquareKm || 0],
        [''],
        ['Use this sheet for further calculations and analysis'],
      ];

      const rawSheet = XLSX.utils.aoa_to_sheet(rawData);
      rawSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw Data');

      // ============================================
      // Generate Excel file as blob and download
      // ============================================
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      link.style.display = 'none'; // Hide link
      
      // Append, click, and cleanup with proper timing
      document.body.appendChild(link);
      link.click();
      
      // Delay cleanup to ensure download starts
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError);
        }
      }, 100);
      
      console.log('Excel file download triggered successfully!');
      
      return { success: true };
    } catch (error) {
      console.error('Excel Export failed:', error);
      return { success: false, error };
    } finally {
      // Ensure state is reset even if there's an error
      setTimeout(() => {
        setIsExporting(false);
      }, 200);
    }
  };

  return { exportToExcel, isExporting };
};
