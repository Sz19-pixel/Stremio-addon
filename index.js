const addonBuilder = require('stremio-addon-sdk').addonBuilder;
const express = require('express');
const cors = require('cors');
const providers = require('./providers');
const app = express();
const port = process.env.PORT || 7000;

const manifest = require('./manifest.json');
const addon = new addonBuilder(manifest);

// معالج التدفقات
addon.defineStreamHandler(async (args) => {
  console.log(`Request for ${args.type}/${args.id}`);
  
  if (!args.id || !args.type) {
    return { streams: [] };
  }
  
  try {
    const streams = await providers.getStreams(args.id, args.type);
    return { streams: streams.slice(0, 10) }; // الحد الأقصى 10 تدفقات
  } catch (err) {
    console.error('Error:', err);
    return { streams: [] };
  }
});

const addonInterface = addon.getInterface();

// إعداد السيرفر
app.use(cors());
app.use(express.static('public'));
app.get('/manifest.json', (_, res) => res.json(manifest));
app.use(addonInterface);

app.listen(port, () => {
  console.log(`Addon running at http://localhost:${port}/manifest.json`);
  console.log('Supported sites: Pstream, Vidora, Nunflix, Embed.su');
});
