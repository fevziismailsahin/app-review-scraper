const fs = require('fs');
const gplay = require('google-play-scraper');

// --- Configuration ---
const APP_ID = 'com.calm.android'; // The package name (ID) of the Android app
const LANGUAGE = 'en'; // Language of the reviews to fetch (e.g., 'en' for English)
const REVIEWS_PER_PAGE = 200; // Number of reviews to fetch per page (max 200 per gplay-scraper)
const MAX_PAGES = 250; // Maximum number of pages to attempt to fetch (Increased for 50,000+ reviews)
const FILE_PATH = 'data/calm_playstore_reviews_en.json'; // Path to save the reviews JSON file
// --- End Configuration ---

let allReviews = []; // Array to store all fetched reviews
const uniqueReviewIds = new Set(); // Set to keep track of unique review IDs to prevent duplicates

// Attempt to load existing reviews from the file
try {
  if (fs.existsSync(FILE_PATH)) {
    const existingData = fs.readFileSync(FILE_PATH, 'utf-8');
    const parsedReviews = JSON.parse(existingData);
    allReviews = parsedReviews;
    allReviews.forEach(review => uniqueReviewIds.add(review.id));
    console.log(`✅ Loaded ${allReviews.length} existing reviews from ${FILE_PATH}.`);
  }
} catch (error) {
  console.warn(`⚠️ Could not read or parse existing review file (${FILE_PATH}): ${error.message}. Starting with an empty review list.`);
  allReviews = []; // Reset if file is corrupted or unreadable
}

/**
 * Main function to fetch all reviews from the Google Play Store.
 * It iterates through pages and sorting methods, handling pagination tokens.
 */
async function fetchAllReviews() {
  let paginationToken = undefined; // Token for fetching the next page of reviews

  // --- Function Validation ---
  // The 'google-play-scraper' library might export 'reviews' directly or as a default export.
  // This line dynamically determines the correct function to use.
  const reviewsFunction = typeof gplay.reviews === 'function' ? gplay.reviews : gplay.default?.reviews;

  if (typeof reviewsFunction !== 'function') {
    console.error(`❌ ERROR: The 'reviews' function was not found in the 'google-play-scraper' library.`);
    console.error(`Please check the library version and ensure 'gplay.reviews' or 'gplay.default.reviews' is available.`);
    console.log(`The 'gplay' object received was:`, gplay);
    return; // Exit if the required function is not found
  }
  // --- End Function Validation ---

  console.log(`🚀 Starting review fetching process for App: ${APP_ID}, Language: ${LANGUAGE}`);

  // Loop through the maximum number of pages
  for (let i = 0; i < MAX_PAGES; i++) {
    const currentPage = i + 1;
    console.log(`\n📄 Fetching page ${currentPage} / ${MAX_PAGES}...`);

    try {
      // Make the request to fetch reviews using the dynamically found function
      const response = await reviewsFunction({
        appId: APP_ID,
        lang: LANGUAGE,
        sort: 2, // Sort by newest reviews (gplay.sort.NEWEST is 2). Changed from gplay.sort.NEWEST to direct value 2 to fix TypeError.
        num: REVIEWS_PER_PAGE, // Number of reviews per page
        paginate: true, // Enable pagination
        nextPaginationToken: paginationToken, // Pass the token for subsequent pages
      });

      const newReviews = response.data; // Array of reviews from the current page
      paginationToken = response.nextPaginationToken; // Get the token for the next page

      // Filter out reviews that have already been collected (based on ID)
      const uniqueNewReviews = newReviews.filter(review => !uniqueReviewIds.has(review.id));
      // Add new unique review IDs to the set
      uniqueNewReviews.forEach(review => uniqueReviewIds.add(review.id));
      // Add the unique new reviews to the main collection
      allReviews.push(...uniqueNewReviews);

      console.log(`👍 Page ${currentPage}: Added ${uniqueNewReviews.length} new unique reviews. (Total collected: ${allReviews.length})`);

      // Break the loop if there's no pagination token or no new reviews were returned
      if (!paginationToken || newReviews.length === 0) {
        console.log('🛑 No more reviews to fetch or pagination ended.');
        break;
      }

      // Introduce a delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay

    } catch (error) {
      console.error(`❌ ERROR: Failed to fetch page ${currentPage}:`, error);
      console.log('This might be due to a change in Google Play Store API, network issues, or temporary blocking.');
      break; // Exit the loop on error
    }
  }

  // Save all collected unique reviews to a JSON file
  try {
    fs.mkdirSync('data', { recursive: true }); // Ensure the 'data' directory exists
    fs.writeFileSync(FILE_PATH, JSON.stringify(allReviews, null, 2)); // Write formatted JSON
    console.log(`\n💾 Successfully completed! Total ${allReviews.length} reviews saved to "${FILE_PATH}".`);
  } catch(error) {
    console.error(`❌ ERROR: Failed to write reviews to file: ${error.message}`);
  }
}

// Execute the main fetching function
fetchAllReviews();
