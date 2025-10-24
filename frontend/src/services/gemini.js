const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCY9eyAXjXvqww9AVNw7ObdGT-SUaXZXAs';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Analyzes a map screenshot to determine area distributions
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {Object} imageMetadata - Image dimensions and scale information
 * @returns {Promise<Object>} Analysis results with percentages
 */
export async function analyzeLocationImage(imageBase64, imageMetadata) {
  try {
    const prompt = `
You are analyzing a map screenshot to determine area distributions for business location analysis.

In this Leaflet map image, the colors represent:
- Yellow: Main roads
- White: Secondary roads  
- Brown/Chocolate: Buildings (residential/commercial)
- Light Gray: Open spaces (parking, plazas)
- Green: Vegetative open spaces (parks, trees)
- Blue: Water bodies (rivers, lakes)

Please analyze this image and provide the exact percentage distribution of these three categories:

1. RESIDENTIAL AREA: All buildings (brown/chocolate colored areas)
2. ROAD AREA: All roads (yellow and white colored areas) 
3. OPEN SPACE AREA: All open spaces (light gray, green, and blue areas)

Image dimensions: ${imageMetadata.width}x${imageMetadata.height} pixels
Map scale: ${imageMetadata.scale} meters/pixel

Please respond with ONLY the percentages in this exact format:
residential: XX%
road: XX%
open_space: XX%

The three percentages must add up to 100%.
`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/png",
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 200,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    
    // Parse the response to extract percentages
    const percentages = parseAreaDistribution(analysisText);
    
    return {
      success: true,
      analysis: percentages,
      rawResponse: analysisText,
      imageMetadata
    };

  } catch (error) {
    console.error('Error analyzing location image:', error);
    throw new Error(`Failed to analyze location: ${error.message}`);
  }
}

/**
 * Parses the Gemini AI response to extract area distribution percentages
 * @param {string} responseText - Raw response from Gemini AI
 * @returns {Object} Parsed percentages
 */
function parseAreaDistribution(responseText) {
  const percentages = {
    residential: 0,
    road: 0,
    openSpace: 0  // Changed to camelCase to match calculateBusinessMetrics
  };

  try {
    // Extract percentages using regex - try multiple patterns
    const residentialMatch = responseText.match(/residential:\s*(\d+(?:\.\d+)?)%/i) ||
                             responseText.match(/residential.*?(\d+(?:\.\d+)?)%/i);
    const roadMatch = responseText.match(/road:\s*(\d+(?:\.\d+)?)%/i) ||
                     responseText.match(/road.*?(\d+(?:\.\d+)?)%/i);
    const openSpaceMatch = responseText.match(/open[_\s]space:\s*(\d+(?:\.\d+)?)%/i) ||
                          responseText.match(/open[_\s]space.*?(\d+(?:\.\d+)?)%/i) ||
                          responseText.match(/green.*?(\d+(?:\.\d+)?)%/i);

    if (residentialMatch) percentages.residential = parseFloat(residentialMatch[1]);
    if (roadMatch) percentages.road = parseFloat(roadMatch[1]);
    if (openSpaceMatch) percentages.openSpace = parseFloat(openSpaceMatch[1]);

    // If no matches found, try to extract any three numbers that might be percentages
    if (percentages.residential === 0 && percentages.road === 0 && percentages.openSpace === 0) {
      const allNumbers = responseText.match(/(\d+(?:\.\d+)?)%/g);
      if (allNumbers && allNumbers.length >= 3) {
        percentages.residential = parseFloat(allNumbers[0]);
        percentages.road = parseFloat(allNumbers[1]);
        percentages.openSpace = parseFloat(allNumbers[2]);
        console.log('Used fallback percentage extraction:', percentages);
      }
    }

    // Validate that percentages add up to 100% (with some tolerance)
    const total = percentages.residential + percentages.road + percentages.openSpace;
    if (Math.abs(total - 100) > 10) {
      console.warn('Area distribution percentages do not add up to 100%:', total, percentages);

      // If percentages don't add up, normalize them
      if (total > 0) {
        const factor = 100 / total;
        percentages.residential = Math.round(percentages.residential * factor);
        percentages.road = Math.round(percentages.road * factor);
        percentages.openSpace = Math.round(percentages.openSpace * factor);
        console.log('Normalized percentages:', percentages);
      }
    }

    console.log('Parsed area distribution:', percentages);
    console.log('Raw AI response:', responseText);

    return percentages;
  } catch (error) {
    console.error('Error parsing area distribution:', error);
    console.error('Raw response text:', responseText);
    throw new Error('Failed to parse area distribution from AI response');
  }
}

/**
 * Calculate area from screenshot dimensions and scale (Kenny chart step 6)
 */
function calculateScreenshotArea(screenshotData) {
  if (!screenshotData || !screenshotData.metadata) {
    throw new Error('Screenshot data or metadata is missing');
  }

  const { metadata } = screenshotData;
  const width = metadata.width;
  const height = metadata.height;

  // Get real scale from metadata (meters per pixel)
  let metersPerPixel = metadata.scale;

  if (!metersPerPixel || metersPerPixel <= 0) {
    throw new Error('Invalid scale data from screenshot metadata');
  }

  // Apply 30.5% error adjustment as specified in Kenny chart
  metersPerPixel = metersPerPixel * 1.305;

  // Calculate real dimensions in meters
  const widthMeters = width * metersPerPixel;
  const heightMeters = height * metersPerPixel;

  // Calculate area in square meters
  const areaSqM = widthMeters * heightMeters;

  // Convert to square kilometers
  const areaSqKm = areaSqM / 1000000;

  console.log('Real area calculation:', {
    pixelDimensions: `${width}x${height}px`,
    scale: `${metersPerPixel.toFixed(4)} m/px`,
    realDimensions: `${widthMeters.toFixed(2)}x${heightMeters.toFixed(2)}m`,
    areaSqM: areaSqM.toFixed(2),
    areaSqKm: areaSqKm.toFixed(6)
  });

  return {
    widthMeters,
    heightMeters,
    areaSqM,
    areaSqKm,
    metersPerPixel,
    pixelWidth: width,
    pixelHeight: height
  };
}

/**
 * Calculates business profitability metrics following Kenny chart flow exactly
 * @param {Object} areaDistribution - Percentages from image analysis
 * @param {Object} businessParams - User input parameters
 * @param {Object} screenshotData - Screenshot data with dimensions
 * @returns {Object} Complete business analysis
 */
export function calculateBusinessMetrics(areaDistribution, businessParams, screenshotData) {
  try {
    // Validate inputs
    if (!areaDistribution || !businessParams || !screenshotData) {
      throw new Error('Missing required data for business calculations');
    }

    const {
      buildingWidth,
      operatingHours,
      productPrice
    } = businessParams;

    // Validate business parameters
    if (!buildingWidth || !operatingHours || !productPrice) {
      throw new Error('Missing business parameters: buildingWidth, operatingHours, or productPrice');
    }

    // Step 6: Calculate area from real screenshot data
    const areaData = calculateScreenshotArea(screenshotData);

    // Validate area percentages from AI analysis
    let residential = parseFloat(areaDistribution.residential) || 0;
    let road = parseFloat(areaDistribution.road) || 0;
    let openSpace = parseFloat(areaDistribution.openSpace) || 0;

    console.log('Raw area distribution from AI:', areaDistribution);
    console.log('Parsed percentages:', { residential, road, openSpace });

    // If all percentages are 0 or invalid, use fallback values
    if (residential === 0 && road === 0 && openSpace === 0) {
      console.warn('All area percentages are 0, using fallback values');
      residential = 45; // Default residential percentage for Jakarta
      road = 25;        // Default road percentage
      openSpace = 30;   // Default open space percentage
    }

    // Ensure percentages are valid numbers
    if (isNaN(residential) || isNaN(road) || isNaN(openSpace)) {
      console.error('Invalid area distribution after parsing:', { residential, road, openSpace });
      throw new Error(`Invalid area distribution percentages from AI analysis: residential=${residential}, road=${road}, openSpace=${openSpace}`);
    }

    // Check if percentages sum to approximately 100%
    const total = residential + road + openSpace;
    if (Math.abs(total - 100) > 15) {
      console.warn('Area percentages do not sum to 100%:', { residential, road, openSpace, total });

      // Normalize percentages if they're way off
      if (total > 0) {
        const factor = 100 / total;
        residential = residential * factor;
        road = road * factor;
        openSpace = openSpace * factor;
        console.log('Normalized percentages:', { residential, road, openSpace });
      }
    }

    const jakartaDensity = 16000; // people per sq km (real Jakarta data)

    // Step 7: Calculate Current Gross Local Population (CGLP)
    // CGLP = Jakarta density × area (sqkm)
    const cglp = jakartaDensity * areaData.areaSqKm;
    console.log(`Step 7 - CGLP: ${jakartaDensity} × ${areaData.areaSqKm.toFixed(6)} = ${cglp.toFixed(2)} people`);

    // Step 8: Estimate population in residential areas
    // pops = CGLP × residential %
    const pops = cglp * (residential / 100);
    console.log(`Step 8 - Residential Population: ${cglp.toFixed(2)} × ${residential}% = ${pops.toFixed(2)} people`);

    // Step 8.1: Calculate road area
    // road_area = road % × total area
    const roadAreaSqm = areaData.areaSqM * (road / 100);
    console.log(`Step 8.1 - Road Area: ${areaData.areaSqM.toFixed(2)} × ${road}% = ${roadAreaSqm.toFixed(2)} sqm`);

    // Step 8.2: Calculate People Density on Road (PDR)
    // PDR = pops / road_area
    if (roadAreaSqm <= 0) {
      throw new Error('Road area is zero or negative - cannot calculate population density');
    }
    const pdr = pops / roadAreaSqm;
    console.log(`Step 8.2 - PDR: ${pops.toFixed(2)} ÷ ${roadAreaSqm.toFixed(2)} = ${pdr.toFixed(6)} people/sqm`);

    // Step 9: Calculate Average Population Capitalization (APC)
    // APC = building width × 30 (avg road width) × PDR
    const avgRoadWidth = 30; // meters (Jakarta average)
    const apc = parseFloat(buildingWidth) * avgRoadWidth * pdr;
    console.log(`Step 9 - APC: ${buildingWidth} × ${avgRoadWidth} × ${pdr.toFixed(6)} = ${apc.toFixed(3)} people`);

    // Step 10: Calculate Average Population Traffic (APT)
    // APT = APC × open time (in seconds)
    const dailySeconds = parseFloat(operatingHours) * 3600; // Convert hours to seconds
    const apt = apc * dailySeconds;
    console.log(`Step 10 - APT: ${apc.toFixed(3)} × ${dailySeconds} = ${apt.toFixed(0)} people daily`);

    // Step 11: Calculate Visitor Capitalizations of Daily Traffic (VCDT)
    // VCDT = APT × visitor rate (0.1% default)
    const visitorRate = 0.1; // 0.1% of people visit the store
    const vcdt = apt * (visitorRate / 100);
    console.log(`Step 11 - VCDT: ${apt.toFixed(0)} × ${visitorRate}% = ${vcdt.toFixed(0)} visitors daily`);

    // Step 12: Calculate Total People-Purchase Daily (TPPD)
    // TPPD = VCDT × purchase rate (90% default)
    const purchaseRate = 90; // 90% of visitors make a purchase
    const tppd = vcdt * (purchaseRate / 100);
    console.log(`Step 12 - TPPD: ${vcdt.toFixed(0)} × ${purchaseRate}% = ${tppd.toFixed(0)} purchases daily`);

    // Step 13: Calculate revenue
    // Revenue = TPPD × price × 30 (monthly)
    const dailyRevenue = tppd * parseFloat(productPrice);
    const monthlyRevenue = dailyRevenue * 30;
    const yearlyRevenue = dailyRevenue * 365;
    console.log(`Step 13 - Revenue: ${tppd.toFixed(0)} × Rp${productPrice} = Rp${dailyRevenue.toFixed(0)} daily, Rp${monthlyRevenue.toFixed(0)} monthly`);

    return {
      success: true,
      metrics: {
        cglp: Math.round(cglp),
        pops: Math.round(pops), // Changed from realPopulation
        roadAreaSqm: Math.round(roadAreaSqm),
        pdr: parseFloat(pdr.toFixed(6)),
        apc: parseFloat(apc.toFixed(3)),
        apt: Math.round(apt),
        vcdt: Math.round(vcdt),
        tppd: Math.round(tppd),
        dailyRevenue: Math.round(dailyRevenue),
        monthlyRevenue: Math.round(monthlyRevenue),
        yearlyRevenue: Math.round(yearlyRevenue)
      },
      areaDistribution,
      businessParams,
      locationData: {
        areaSquareKm: areaData.areaSqKm,
        populationDensityPerSqKm: jakartaDensity,
        screenshotArea: areaData
      },
      // Kenny chart calculation steps for transparency
      calculationSteps: {
        step6_areaCalculation: areaData,
        step7_cglp: cglp,
        step8_pops: pops,
        step8_1_roadArea: roadAreaSqm,
        step8_2_pdr: pdr,
        step9_apc: apc,
        step10_apt: apt,
        step11_vcdt: vcdt,
        step12_tppd: tppd,
        step13_revenue: { daily: dailyRevenue, monthly: monthlyRevenue }
      }
    };

  } catch (error) {
    console.error('Error calculating business metrics:', error);
    throw new Error(`Failed to calculate business metrics: ${error.message}`);
  }
}

export default {
  analyzeLocationImage,
  calculateBusinessMetrics
};
