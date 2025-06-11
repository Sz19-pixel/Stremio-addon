const { fetchPage, extractPlaybackLinks, filterValidLinks } = require('./utils');
const axios = require('axios');

// دعم مواقع متعددة
const providers = [
  {
    name: 'Pstream',
    url: (id, type) => `https://www.pstream.net/${type === 'movie' ? 'm' : 'tv'}/${id}`,
    handler: async (url) => {
      const html = await fetchPage(url);
      if (!html) return [];
      
      const links = extractPlaybackLinks(html);
      return filterValidLinks(links).map(link => ({
        title: `Pstream - ${link.includes('.m3u8') ? 'HLS' : 'MP4'}`,
        url: link
      }));
    }
  },
  {
    name: 'Vidora',
    url: (id, type) => `https://watch.vidora.su/${type}/${id}`,
    handler: async (url) => {
      const html = await fetchPage(url);
      if (!html) return [];
      
      const $ = cheerio.load(html);
      const sources = [];
      
      // البحث في iframes
      $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('vidora')) {
          sources.push(src);
        }
      });
      
      // استخراج روابط من سكريبتات
      const scriptLinks = extractPlaybackLinks(html);
      return [...sources, ...scriptLinks]
        .filter(link => link.includes('vidora'))
        .map(link => ({
          title: `Vidora - ${link.includes('.m3u8') ? 'HLS' : 'Direct'}`,
          url: link
        }));
    }
  },
  {
    name: 'Nunflix',
    url: (id, type) => `https://nunflix.org/${type}/${id}`,
    handler: async (url) => {
      const html = await fetchPage(url);
      if (!html) return [];
      
      const $ = cheerio.load(html);
      const sources = [];
      
      // البحث في عناصر الفيديو
      $('video source').each((i, el) => {
        const src = $(el).attr('src');
        if (src) sources.push(src);
      });
      
      // استخراج من السكريبتات
      const scriptLinks = extractPlaybackLinks(html);
      return [...sources, ...scriptLinks].map(link => ({
        title: `Nunflix - ${link.includes('.m3u8') ? 'HLS' : 'MP4'}`,
        url: link
      }));
    }
  },
  {
    name: 'Embed.su',
    url: (id, type) => `https://embed.su/embed/${id}`,
    handler: async (url) => {
      const html = await fetchPage(url);
      if (!html) return [];
      
      const $ = cheerio.load(html);
      const sources = [];
      
      // البحث في iframes
      $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src) sources.push(src);
      });
      
      // استخراج من السكريبتات
      const scriptLinks = extractPlaybackLinks(html);
      return [...sources, ...scriptLinks].map(link => ({
        title: `Embed.su - ${link.includes('.m3u8') ? 'HLS' : 'Embed'}`,
        url: link
      }));
    }
  }
];

// الدالة الرئيسية للحصول على التدفقات
module.exports.getStreams = async (id, type) => {
  const results = [];
  
  for (const provider of providers) {
    try {
      const providerUrl = provider.url(id, type);
      console.log(`Trying provider: ${provider.name} at ${providerUrl}`);
      
      const streams = await provider.handler(providerUrl);
      if (streams && streams.length > 0) {
        results.push(...streams);
      }
    } catch (error) {
      console.error(`Error with ${provider.name}:`, error.message);
    }
  }
  
  // إضافة معلومات إضافية للتدفقات
  return results.map((stream, index) => ({
    ...stream,
    behaviorHints: {
      notWebReady: stream.url.includes('.m3u8'),
      bingeGroup: `${type}-${id}`
    }
  }));
};
