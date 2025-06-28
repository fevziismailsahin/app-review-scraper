const fs = require('fs');
const axios = require('axios');

// The App ID for the Calm app
const appId = '571800810';

// Maximum number of cycles to run. Each cycle fetches 'pagesPerCycle' pages.
// We keep this high to continuously check for new reviews that might appear
// on the first 10 pages over time, even if the current unique review count is capped.
const maxCycles = 3;

// Number of pages to fetch in each cycle.
// IMPORTANT: The Apple App Store RSS feed API appears to have a hard limit
// of 10 pages per sorting method. Requests for pages beyond 10 will fail.
// We set this to 10 to reflect the API's actual limit.
const pagesPerCycle = 10;

// A Map to store all unique reviews, using review ID as the key to prevent duplicates.
const allReviews = new Map();

// Utility function to pause execution for a given number of milliseconds.
// This helps prevent overwhelming the server with too many requests too quickly.
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches reviews from the Apple App Store RSS feed for a given app ID.
 * It iterates through different sorting methods and pages to collect reviews.
 */
async function fetchReviews() {
  // Array of sorting methods to cycle through.
  // 'mostrecent' and 'mosthelpful' are common options.
  const sortMethods = ['mostrecent', 'mosthelpful'];

  // Loop through a defined number of cycles.
  for (let cycle = 0; cycle < maxCycles; cycle++) {
    // Determine the sorting method for the current cycle.
    // This ensures we try different sorts to potentially find more reviews.
    const sortBy = sortMethods[cycle % sortMethods.length];
    console.log(`\n🔄 Cycle ${cycle + 1}/${maxCycles} - Sort: ${sortBy}\n`);

    // Loop through the pages for the current sorting method.
    for (let page = 1; page <= pagesPerCycle; page++) {
      // Construct the URL for the RSS feed.
      const url = `https://itunes.apple.com/rss/customerreviews/page=${page}/id=${appId}/sortby=${sortBy}/json`;
      console.log(`📄 Fetching page ${page}/${pagesPerCycle} (Sort: ${sortBy})...`);

      try {
        // Make the HTTP GET request to the App Store API.
        const response = await axios.get(url);
        const entries = response.data.feed.entry;

        // Check if there are no more new reviews on the current page.
        // The RSS feed often includes a single entry that is not a review (e.g., feed metadata).
        if (!entries || entries.length <= 1) {
          console.log(`⛔ No more reviews found at page ${page} for sort method '${sortBy}'. Moving to next sort/cycle.`);
          break; // Exit the page loop for the current sort method
        }

        // Process the fetched entries, skipping the first one (which is usually metadata).
        const reviews = entries.slice(1).map(entry => ({
          id: entry.id.label, // Unique ID for the review
          author: entry.author.name.label, // Author's name
          title: entry.title.label, // Review title
          content: entry.content.label, // Review content
          rating: entry['im:rating'].label, // Star rating
          version: entry['im:version'].label, // App version review was for
          updated: entry.updated.label // Last updated timestamp
        }));

        // Add unique reviews to the Map. If a review with the same ID already exists,
        // it will be overwritten, effectively keeping only the latest/first encountered version.
        for (const review of reviews) {
          allReviews.set(review.id, review);
        }

        console.log(`✨ Fetched ${reviews.length} reviews from page ${page}. Total unique reviews collected: ${allReviews.size}`);

      } catch (err) {
        // Log a warning if there's an error fetching a page (e.g., network issue, rate limit, or page limit).
        console.warn(`⚠️ Error fetching page ${page} (Sort: ${sortBy}): ${err.message}. This often indicates an API page limit.`);
        break; // Exit the page loop for the current sort method on error
      }

      // Pause for 1 second to avoid hitting rate limits.
      await sleep(1000);
    }
  }

  // Convert the Map of unique reviews back into an array.
  const uniqueReviews = Array.from(allReviews.values());

  // Create a 'data' directory if it doesn't exist.
  fs.mkdirSync('data', { recursive: true });

  // Save the collected unique reviews to a JSON file.
  fs.writeFileSync(`data/calm_appstore_reviews_en.json`, JSON.stringify(uniqueReviews, null, 2));

  console.log(`\n✅ Finished fetching reviews. Saved ${uniqueReviews.length} unique reviews to data/${appId}_all_reviews.json`);
}

// Start the review fetching process.
fetchReviews();
