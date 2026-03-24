/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: 'Site & Config',
      items: [
        'content/site',
        'content/headers-config',
        'content/security-config',
        'content/crawler-config',
        'content/sitemap',
        'content/error-page',
        'content/external-script',
        'content/editor-roles',
      ],
    },
    {
      type: 'category',
      label: 'Pages & Layouts',
      items: [
        'content/page',
        'content/layout',
        'content/layout-config',
      ],
    },
    {
      type: 'category',
      label: 'Navigation',
      items: [
        'content/navigation',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'content/persona',
        'content/translation-namespace',
      ],
    },
    {
      type: 'category',
      label: 'Specifications',
      items: [
        'UCM',
        'UCF',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/vercel',
        'guides/cloudflare',
        'guides/markdown-endpoints',
        'guides/webhook.edge',
      ],
    },
  ],
};

module.exports = sidebars;
