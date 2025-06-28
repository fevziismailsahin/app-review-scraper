const fs = require('fs');
const path = require('path');

// --- Configuration ---
const APPSTORE_FILE = 'calm_appstore_reviews_en.json';
const PLAYSTORE_FILE = 'calm_playstore_reviews_en.json';
const OUTPUT_JSON_FILE = 'calm_all_reviews_merged.json';
const OUTPUT_CSV_FILE = 'calm_all_reviews_merged.csv';
const DATA_DIR = 'data'; // Directory where your JSON files are located
// --- End Configuration ---

/**
 * Reads and parses a JSON file.
 * @param {string} filePath - The full path to the JSON file.
 * @returns {Array} - The parsed array of reviews, or an empty array if an error occurs.
 */
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim() === '') {
        console.warn(`⚠️ Warning: ${filePath} is empty. Skipping.`);
        return [];
      }
      return JSON.parse(fileContent);
    } else {
      console.warn(`⚠️ Warning: File not found at ${filePath}. Skipping.`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error reading or parsing ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Converts an array of review objects to CSV format.
 * It flattens nested objects (like 'criterias') and ensures all fields are handled.
 * @param {Array<Object>} data - The array of review objects.
 * @returns {string} - The data in CSV format.
 */
function convertToCsv(data) {
  if (!data || data.length === 0) {
    return '';
  }

  // Collect all possible headers from all reviews to ensure comprehensive columns
  const allKeys = new Set();
  data.forEach(review => {
    for (const key in review) {
      if (typeof review[key] !== 'object' || review[key] === null) {
        allKeys.add(key);
      } else if (Array.isArray(review[key])) {
        // For arrays, we'll stringify them for CSV
        allKeys.add(key);
      } else {
        // For nested objects, flatten their keys with a prefix
        for (const nestedKey in review[key]) {
          allKeys.add(`${key}_${nestedKey}`);
        }
      }
    }
  });

  // Define a consistent order for headers
  const headers = Array.from(allKeys).sort();

  const csvRows = [];
  csvRows.push(headers.join(',')); // Add header row

  data.forEach(review => {
    const values = headers.map(header => {
      let value = '';
      if (header.includes('_')) {
        // Handle flattened nested object keys (e.g., "criterias_criteria", "criterias_rating")
        const [parentKey, nestedKey] = header.split('_');
        if (review[parentKey] && typeof review[parentKey] === 'object' && !Array.isArray(review[parentKey])) {
          value = review[parentKey][nestedKey] !== undefined ? review[parentKey][nestedKey] : '';
        } else if (Array.isArray(review[parentKey])) {
          // If the parent is an array, we'll just stringify the whole array for the main key
          // This specific nested key handling might not be perfect for all array-of-objects scenarios,
          // but it covers the 'criterias' array by leaving it to the main key handling.
          value = JSON.stringify(review[parentKey]);
        }
      } else {
        // Handle top-level keys
        value = review[header] !== undefined ? review[header] : '';
        if (typeof value === 'string') {
          // Escape double quotes and enclose in double quotes if it contains commas or double quotes
          value = `"${value.replace(/"/g, '""')}"`;
        } else if (Array.isArray(value) || typeof value === 'object') {
          // Stringify arrays and objects for CSV cells
          value = `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
      }
      return value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}


/**
 * Merges review data from multiple sources, ensuring uniqueness by review ID.
 * Also saves the merged data in JSON and CSV formats.
 */
async function mergeReviews() {
  console.log('🚀 Starting review merge process...');

  // Corrected paths to navigate up one directory from 'scripts' to the project root, then into 'data'
  const projectRoot = path.resolve(__dirname, '..'); // Go up one level from 'scripts'
  const dataDirPath = path.join(projectRoot, DATA_DIR);

  const appstoreFilePath = path.join(dataDirPath, APPSTORE_FILE);
  const playstoreFilePath = path.join(dataDirPath, PLAYSTORE_FILE);
  const outputJsonFilePath = path.join(dataDirPath, OUTPUT_JSON_FILE);
  const outputCsvFilePath = path.join(dataDirPath, OUTPUT_CSV_FILE);

  console.log(`📄 Reading App Store reviews from: ${appstoreFilePath}`);
  const appstoreReviews = readJsonFile(appstoreFilePath);
  console.log(`✅ Loaded ${appstoreReviews.length} reviews from App Store.`);

  console.log(`📄 Reading Play Store reviews from: ${playstoreFilePath}`);
  const playstoreReviews = readJsonFile(playstoreFilePath);
  console.log(`✅ Loaded ${playstoreReviews.length} reviews from Play Store.`);

  const allReviewsMap = new Map(); // Use a Map to automatically handle duplicates by ID

  // Add App Store reviews to the map
  appstoreReviews.forEach(review => {
    if (review && review.id) { // Ensure review and id exist
      allReviewsMap.set(review.id, { ...review, source: 'AppStore' }); // Add source for clarity
    }
  });
  console.log(`✨ Added ${appstoreReviews.length} App Store reviews to the collection. Current unique count: ${allReviewsMap.size}`);

  // Add Play Store reviews to the map
  // Reviews with the same ID will overwrite existing ones (last one wins, which is fine for duplicates)
  playstoreReviews.forEach(review => {
    // For Play Store reviews, normalize the ID if it's a UUID to match App Store's string IDs
    // Or, if App Store IDs are numeric, ensure Play Store IDs are treated as strings.
    // Assuming Play Store IDs are already strings or can be used as unique keys directly.
    // Adding a 'source' field to distinguish reviews from different platforms.
    if (review && review.id) { // Ensure review and id exist
      allReviewsMap.set(review.id, { ...review, source: 'PlayStore' }); // Add source for clarity
    }
  });
  console.log(`✨ Added ${playstoreReviews.length} Play Store reviews to the collection. Final unique count: ${allReviewsMap.size}`);

  const mergedReviews = Array.from(allReviewsMap.values()); // Convert Map values back to an array

  // Ensure the data directory exists before writing
  fs.mkdirSync(dataDirPath, { recursive: true }); // Use the corrected dataDirPath

  // Save all collected unique reviews to a JSON file
  try {
    fs.writeFileSync(outputJsonFilePath, JSON.stringify(mergedReviews, null, 2)); // Write formatted JSON
    console.log(`\n💾 Successfully merged ${mergedReviews.length} unique reviews to "${outputJsonFilePath}".`);
  } catch(error) {
    console.error(`❌ Error writing merged reviews to JSON file: ${error.message}`);
  }

  // Save all collected unique reviews to a CSV file
  try {
    const csvContent = convertToCsv(mergedReviews);
    fs.writeFileSync(outputCsvFilePath, csvContent);
    console.log(`\n💾 Successfully saved ${mergedReviews.length} unique reviews to "${outputCsvFilePath}" in CSV format.`);
  } catch(error) {
    console.error(`❌ Error writing merged reviews to CSV file: ${error.message}`);
  }
}

// Execute the merge function
mergeReviews();
