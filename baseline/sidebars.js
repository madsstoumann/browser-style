/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: '🏠 Site & Config',
      items: [
        'site',
        'headers-config',
        'security-config',
        'crawler-config',
        'sitemap',
        'error-page',
        'external-script',
        'editor-roles',
      ],
    },
    {
      type: 'category',
      label: '📄 Pages & Layouts',
      items: [
        'page',
        'layout',
        'layout-config',
      ],
    },
    {
      type: 'category',
      label: '🧭 Navigation',
      items: [
        'navigation',
      ],
    },
    {
      type: 'category',
      label: '✨ Features',
      items: [
        'persona',
        'translation-namespace',
      ],
    },
    {
      type: 'category',
      label: '📋 Specifications',
      items: [
        'UCM',
        'UCF',
      ],
    },
    {
      type: 'category',
      label: '📖 Guides',
      items: [
        'vercel',
        'cloudflare',
        'markdown-endpoints',
        'webhook.edge',
      ],
    },
  ],
};

module.exports = sidebars;
