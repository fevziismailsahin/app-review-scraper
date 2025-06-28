const fs = require('fs');
const axios = require('axios');

const appId = '571800810'; // Calm app
const maxCycles = 5; // 5 * 10 = 50 pages
const pagesPerCycle = 10;
const allReviews = new Map();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchReviews() {
  const sortMethods = ['mostrecent', 'mosthelpful', 'mostrecent']; // döngüye tekrar alınabilir

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const sortBy = sortMethods[cycle % sortMethods.length];
    console.log(`\n🔄 Cycle ${cycle + 1} - Sort: ${sortBy}\n`);

    for (let page = 1; page <= pagesPerCycle; page++) {
      const url = `https://itunes.apple.com/rss/customerreviews/page=${page}/id=${appId}/sortby=${sortBy}/json`;
      console.log(`📄 Fetching page ${page}...`);

      try {
        const response = await axios.get(url);
        const entries = response.data.feed.entry;

        if (!entries || entries.length <= 1) {
          console.log(`⛔ No more reviews at page ${page}.`);
          break;
        }

        const reviews = entries.slice(1).map(entry => ({
          id: entry.id.label,
          author: entry.author.name.label,
          title: entry.title.label,
          content: entry.content.label,
          rating: entry['im:rating'].label,
          version: entry['im:version'].label,
          updated: entry.updated.label
        }));

        // Map ile tekrarları engelle
        for (const review of reviews) {
          allReviews.set(review.id, review);
        }

      } catch (err) {
        console.warn(`⚠️ Page ${page} error: ${err.message}`);
        break;
      }

      await sleep(1000); // Aşırı yüklenmeyi önle
    }
  }

  const uniqueReviews = Array.from(allReviews.values());

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(`data/${appId}_all_reviews.json`, JSON.stringify(uniqueReviews, null, 2));
  console.log(`\n✅ Saved ${uniqueReviews.length} unique reviews`);
}

fetchReviews();