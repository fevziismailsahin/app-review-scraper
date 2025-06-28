// Kütüphaneyi tekrar tek bir nesne olarak import ediyoruz.
const gplay = require('google-play-scraper');
const fs = require('fs');

// --- Ayarlar ---
const APP_ID = 'com.calm.android';
const LANGUAGE = 'en';
const REVIEWS_PER_PAGE = 150;
const MAX_PAGES = 50;
const FILE_PATH = 'data/calm_playstore_reviews_en.json';
// --- Bitiş Ayarlar ---

let allReviews = [];
const uniqueReviewIds = new Set();

try {
  if (fs.existsSync(FILE_PATH)) {
    const existingData = fs.readFileSync(FILE_PATH, 'utf-8');
    allReviews = JSON.parse(existingData);
    allReviews.forEach(review => uniqueReviewIds.add(review.id));
    console.log(`✅ Mevcut dosyadan ${allReviews.length} yorum yüklendi.`);
  }
} catch (e) {
  console.warn(`⚠️ Mevcut yorum dosyası okunamadı veya bozuk: ${e.message}. Sıfırdan başlanıyor.`);
  allReviews = [];
}

async function fetchAllReviews() {
  let paginationToken = undefined;

  // --- KONTROL ---
  // Eğer 'gplay.reviews' bir fonksiyon değilse, 'gplay.default.reviews' olmalı.
  // Bu satır, doğru fonksiyonu bulup 'reviewsFunction' değişkenine atar.
  const reviewsFunction = typeof gplay === 'function' ? gplay : gplay.default?.reviews;

  if (typeof reviewsFunction !== 'function') {
    console.error("❌ HATA! 'google-play-scraper' kütüphanesinden 'reviews' fonksiyonu bulunamadı.");
    console.log("Kütüphane yapısı beklenmedik şekilde değişmiş olabilir. Lütfen kütüphane versiyonunu kontrol edin.");
    // Hatanın ne olduğunu anlamak için kütüphaneden gelen nesneyi yazdıralım:
    console.log("Gelen 'gplay' nesnesi:", gplay);
    return; // Fonksiyon bulunamadıysa devam etme.
  }
  // --- KONTROL SONU ---

  console.log(`🚀 Yorumları çekme işlemi başlatılıyor... App: ${APP_ID}, Dil: ${LANGUAGE}`);

  for (let i = 0; i < MAX_PAGES; i++) {
    const currentPage = i + 1;
    console.log(`\n📄 Sayfa ${currentPage} / ${MAX_PAGES} çekiliyor...`);

    try {
      // Yorumları çekme isteği - Artık dinamik olarak bulduğumuz doğru fonksiyonu kullanıyoruz.
      const response = await reviewsFunction({
        appId: APP_ID,
        lang: LANGUAGE,
        sort: 2, // 1: En Yardımcı, 2: En Yeni, 3: Puana Göre
        num: REVIEWS_PER_PAGE,
        paginate: true,
        nextPaginationToken: paginationToken,
      });

      const newReviews = response.data;
      paginationToken = response.nextPaginationToken;

      const uniqueNewReviews = newReviews.filter(review => !uniqueReviewIds.has(review.id));
      uniqueNewReviews.forEach(review => uniqueReviewIds.add(review.id));
      allReviews.push(...uniqueNewReviews);

      console.log(`👍 Sayfa ${currentPage}: ${uniqueNewReviews.length} yeni yorum eklendi. (Toplam: ${allReviews.length})`);

      if (!paginationToken || newReviews.length === 0) {
        console.log('🛑 Çekilecek başka yorum kalmadı.');
        break;
      }

    } catch (err) {
      console.error(`❌ HATA! Sayfa ${currentPage} çekilemedi:`, err);
      console.log('Bu hata, Google Play Store tarafından yapılan bir değişiklik veya ağ sorunu nedeniyle olabilir.');
      break;
    }
  }

  try {
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(allReviews, null, 2));
    console.log(`\n💾 Başarıyla tamamlandı! Toplam ${allReviews.length} yorum "${FILE_PATH}" dosyasına kaydedildi.`);
  } catch(e) {
    console.error(`❌ Dosyaya yazma hatası: ${e.message}`);
  }
}

fetchAllReviews();