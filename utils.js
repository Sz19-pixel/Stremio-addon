const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');

// تهيئة وكيل عشوائي
const getRandomAgent = () => {
  return new UserAgent().toString();
};

// جلب محتوى الصفحة مع تجاوز الحماية
const fetchPage = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
        'Referer': 'https://www.google.com/',
        'DNT': '1'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
};

// استخراج روابط التشغيل من سكريبتات الجافا
const extractPlaybackLinks = (html) => {
  const $ = cheerio.load(html);
  const links = [];
  
  // البحث في نصوص السكريبت
  $('script').each((i, script) => {
    const scriptContent = $(script).html();
    if (scriptContent) {
      // استخراج روابط m3u8
      const m3u8Matches = scriptContent.match(/(https?:\/\/[^\s'"]+\.m3u8[^\s'"]*)/gi);
      if (m3u8Matches) {
        links.push(...m3u8Matches);
      }
      
      // استخراج روابط MP4
      const mp4Matches = scriptContent.match(/(https?:\/\/[^\s'"]+\.mp4[^\s'"]*)/gi);
      if (mp4Matches) {
        links.push(...mp4Matches);
      }
    }
  });
  
  return [...new Set(links)]; // إزالة التكرارات
};

// تصفية الروابط الصالحة
const filterValidLinks = (links) => {
  return links.filter(link => {
    // استبعاد روابط غير مرغوبة
    if (link.includes('google') || 
        link.includes('facebook') || 
        link.includes('doubleclick') ||
        link.includes('analytics')) {
      return false;
    }
    return true;
  });
};

module.exports = {
  fetchPage,
  extractPlaybackLinks,
  filterValidLinks,
  getRandomAgent
};
