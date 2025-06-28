const store = require('app-store-scraper');
const fs = require('fs');

const FILE_PATH = 'data/calm_appstore_reviews.json';

// Önceki yorumları oku
let savedReviews = [];
const uniqueReviewIds = new Set();

if (fs.existsSync(FILE_PATH)) {
  const data = fs.readFileSync(FILE_PATH);
  savedReviews = JSON.parse(data);
  savedReviews.forEach(review => uniqueReviewIds.add(review.id));
}

const SORT_TYPES = [store.sort.RECENT, store.sort.HELPFUL, store.sort.RELEVANT];
const COUNTRY_CODES = ['us', 'gb', 'ca', 'au']; // İngilizce konuşulan ülkeler
const LANG_CODES = ['en'];

async function fetchBatch(sortType, country, lang) {
  console.log(`\n🌍 Fetching: sort=${sortType}, country=${country}, lang=${lang}`);

  for (let page = 1; page <= 10; page++) {
    try {
      console.log(`📄 Page ${page}...`);
      const reviews = await store.reviews({
        id: '571800810',
        sort: sortType,
        page,
        country,
        lang
      });

      if (reviews.length === 0) break;

      let added = 0;
      for (const review of reviews) {
        if (!uniqueReviewIds.has(review.id)) {
          uniqueReviewIds.add(review.id);
          savedReviews.push(review);
          added++;
        }
      }
      console.log(`✅ Page ${page}: ${added} new reviews added`);

    } catch (err) {
      console.warn(`⚠️ Error on page ${page}: ${err.message}`);
      break;
    }
  }
}

async function fetchAll() {
  for (const sort of SORT_TYPES) {
    for (const country of COUNTRY_CODES) {
      for (const lang of LANG_CODES) {
        await fetchBatch(sort, country, lang);
      }
    }
  }

  // Kaydet
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(savedReviews, null, 2));
  console.log(`\n💾 Total unique reviews saved: ${savedReviews.length}`);
}

fetchAll().catch(console.error);