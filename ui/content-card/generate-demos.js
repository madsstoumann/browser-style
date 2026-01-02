/**
 * Generate per-card-type demo pages
 *
 * This script reads the card data files and generates individual HTML demo pages
 * for each card type (article.html, recipe.html, product.html, etc.)
 *
 * Usage: node generate-demos.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Card types that have registered custom elements
const CARD_TYPES = [
  'achievement',
  'announcement',
  'article',
  'booking',
  'business',
  'comparison',
  'contact',
  'course',
  'event',
  'faq',
  'gallery',
  'job',
  'location',
  'membership',
  'news',
  'poll',
  'product',
  'profile',
  'quote',
  'recipe',
  'review',
  'social',
  'software',
  'statistic',
  'timeline'
];

// Human-readable titles for each card type
const CARD_TITLES = {
  achievement: 'Achievements & Certifications',
  announcement: 'Announcements',
  article: 'Articles',
  booking: 'Bookings & Reservations',
  business: 'Business Listings',
  comparison: 'Comparisons',
  contact: 'Contact Information',
  course: 'Courses & Learning',
  event: 'Events',
  faq: 'FAQ',
  gallery: 'Galleries',
  job: 'Job Listings',
  location: 'Locations & Places',
  membership: 'Memberships & Plans',
  news: 'News',
  poll: 'Polls & Surveys',
  product: 'Products',
  profile: 'Profiles',
  quote: 'Quotes',
  recipe: 'Recipes',
  review: 'Reviews',
  social: 'Social Posts',
  software: 'Software',
  statistic: 'Statistics & Metrics',
  timeline: 'Timelines'
};

// Generate HTML template for a card type
function generateHTML(cardType, cardIds, dataFile) {
  const title = CARD_TITLES[cardType] || cardType.charAt(0).toUpperCase() + cardType.slice(1);
  const tagName = `${cardType}-card`;

  // Generate card elements
  const cardElements = cardIds.map((id, index) => {
    // Alternate layouts for visual variety
    const layouts = [
      '',
      'layout="rows(thl pa1)"',
      'layout="pa1.5"',
      'layout="rows(thd ar21x9 pa1)"'
    ];
    const layout = layouts[index % layouts.length];
    return `\t\t<${tagName} content="${id}" ${layout}></${tagName}>`;
  }).join('\n');

  // Determine grid columns based on number of cards
  const columnCount = cardIds.length === 1 ? 1 : cardIds.length === 2 ? 2 : 3;

  return `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
\t<title>${title}</title>
\t<meta charset="UTF-8">
\t<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
\t<meta name="description" content="${title} - Content Card demos">
\t<meta name="view-transition" content="same-origin">
\t<link rel="stylesheet" href="/base.css">
\t<script type="importmap">
\t{
\t\t"imports": {
\t\t\t"@browser.style/layout": "../../layout/index.js",
\t\t\t"@browser.style/layout/": "../../layout/",
\t\t\t"@browser.style/layout/maps": "./static/js/layouts-map.js",
\t\t\t"@browser.style/layout/src/srcsets.js": "../../layout/src/srcsets.js",
\t\t\t"@browser.style/layout/polyfills/attr-fallback.js": "../../layout/polyfills/attr-fallback.js"
\t\t}
\t}
\t</script>
\t<link rel="stylesheet" href="static/css/layout.css" blocking="render" data-build="exclude">
\t<link rel="stylesheet" href="../src/css/index.css" blocking="render">
\t<link rel="stylesheet" href="static/css/themes/demo.css" blocking="render">
\t<script type="module" src="../../layout/polyfills/attr-fallback.js"></script>
</head>
<body>
\t<h1>${title}</h1>
\t<lay-out lg="columns(${columnCount})" col-gap="2" row-gap="2" gap pad-top="1" pad-bottom="2">
${cardElements}
\t</lay-out>
\t<script type="module">
\t\timport { initContentCards } from '../src/js/runtime.js';
\t\tinitContentCards('${dataFile}');
\t</script>
</body>
</html>
`;
}

// Main function
async function generateDemos() {
  console.log('Generating per-card-type demo pages...\n');

  // Load both data files
  const dataPath = path.join(__dirname, 'public/static/data/data.json');
  const cardsPath = path.join(__dirname, 'public/static/data/cards.json');

  let allData = [];

  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    allData = allData.concat(data.map(item => ({ ...item, dataFile: 'static/data/data.json' })));
  }

  if (fs.existsSync(cardsPath)) {
    const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    allData = allData.concat(cards.map(item => ({ ...item, dataFile: 'static/data/cards.json' })));
  }

  // Group cards by type
  const cardsByType = {};
  for (const item of allData) {
    const type = item.type;
    if (!cardsByType[type]) {
      cardsByType[type] = { ids: [], dataFile: item.dataFile };
    }
    cardsByType[type].ids.push(item.id);
  }

  // Create a combined data file for demos
  const combinedData = [];
  if (fs.existsSync(dataPath)) {
    combinedData.push(...JSON.parse(fs.readFileSync(dataPath, 'utf8')));
  }
  if (fs.existsSync(cardsPath)) {
    combinedData.push(...JSON.parse(fs.readFileSync(cardsPath, 'utf8')));
  }

  // Write combined data file
  const combinedPath = path.join(__dirname, 'public/static/data/all-cards.json');
  fs.writeFileSync(combinedPath, JSON.stringify(combinedData, null, 2));
  console.log(`Created: public/static/data/all-cards.json (${combinedData.length} cards)\n`);

  // Generate demo pages for each card type to public/ for build process
  const outputDir = path.join(__dirname, 'public');
  let generatedCount = 0;

  for (const type of CARD_TYPES) {
    const typeData = cardsByType[type];

    if (!typeData || typeData.ids.length === 0) {
      console.log(`Skipping ${type}: No cards found`);
      continue;
    }

    const html = generateHTML(type, typeData.ids, 'static/data/all-cards.json');
    const outputPath = path.join(outputDir, `${type}.html`);

    fs.writeFileSync(outputPath, html);
    console.log(`Created: public/${type}.html (${typeData.ids.length} cards)`);
    generatedCount++;
  }

  console.log(`\n${generatedCount} demo pages generated to public/.`);
  console.log('Run "npm run build" to render static HTML to dist/.');
}

generateDemos().catch(console.error);
