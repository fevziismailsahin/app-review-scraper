const store = require('app-store-scraper');
const fs = require('fs');

async function fetchAllReviews() {
  const allReviewsMap = new Map();
  const appId = '571800810';
  const maxPages = 20; // 20 sayfa * 100 yorum = 2000 yorum denemesi

  for (let page = 0; page < maxPages; page++) {
    console.log(`Fetching page ${page + 1}...`);
    try {
      const reviews = await store.reviews({
        id: appId,
        page: page,
        sort: store.sort.RECENT,
        country: 'us',
        lang: 'en',
        num: 100,
      });

      if (reviews.length === 0) {
        console.log('No more reviews found, ending...');
        break;
      }

      for (const r of reviews) {
        allReviewsMap.set(r.id, r);
      }

      // API'yi zorlamamak için ufak gecikme
      await new Promise((res) => setTimeout(res, 1000));

    } catch (error) {
      console.error(`Error fetching page ${page + 1}:`, error);
      break;
    }
  }

  const allReviews = Array.from(allReviewsMap.values());

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/calm_appstore_all.json', JSON.stringify(allReviews, null, 2));
  console.log(`✅ Saved ${allReviews.length} unique reviews`);
}

fetchAllReviews();