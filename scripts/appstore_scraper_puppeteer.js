const puppeteer = require('puppeteer');
const fs = require('fs');

const appId = 'id571800810'; // Calm app's App Store ID
const maxReviews = 5000;     // Kaç yorum çekmek istiyoruz

async function scrapeAppStoreReviews() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
  );

  const baseUrl = `https://apps.apple.com/us/app/${appId}/reviews`;
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });

  let allReviews = [];
  let currentPage = 1;

  while (allReviews.length < maxReviews) {
    console.log(`📄 Sayfa ${currentPage} yükleniyor...`);

    try {
      await page.waitForSelector('.we-customer-review', { timeout: 10000 });

      const newReviews = await page.evaluate(() => {
        const reviewElements = document.querySelectorAll('.we-customer-review');
        return Array.from(reviewElements).map(el => ({
          user: el.querySelector('.we-customer-review__user')?.innerText.trim(),
          rating: el.querySelector('.we-star-rating-stars-outlined')?.getAttribute('aria-label'),
          title: el.querySelector('.we-customer-review__title')?.innerText.trim(),
          body: el.querySelector('.we-customer-review__body')?.innerText.trim(),
          date: el.querySelector('time')?.getAttribute('datetime'),
        }));
      });

      allReviews.push(...newReviews);

      // Daha fazla sayfa yoksa çık
      const nextButton = await page.$('button.we-pagination__button--next');
      if (!nextButton || newReviews.length === 0) break;

      await nextButton.click();
      await page.waitForTimeout(3000); // Biraz bekle
      currentPage++;

    } catch (err) {
      console.warn(`⚠️ Sayfa ${currentPage} çekilemedi:`, err.message);
      break;
    }
  }

  // Aynı yorumları filtrele (opsiyonel)
  const unique = Array.from(new Map(allReviews.map(r => [r.user + r.date, r])).values());

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(`data/${appId}_reviews.json`, JSON.stringify(unique, null, 2));
  console.log(`✅ Toplam ${unique.length} yorum kaydedildi.`);
  
  await browser.close();
}

scrapeAppStoreReviews();