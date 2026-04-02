// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Baseline',
  tagline: 'CMS-agnostic content architecture',
  url: 'https://browser.style',
  baseUrl: '/cms/baseline/docs/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: './pages',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/madsstoumann/browser-style/edit/main/cms/baseline/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Baseline',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/madsstoumann/browser-style/tree/main/cms/baseline',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Introduction', to: '/' },
              { label: 'Site', to: '/site' },
              { label: 'Page', to: '/page' },
            ],
          },
          {
            title: 'Guides',
            items: [
              { label: 'Vercel', to: '/vercel' },
              { label: 'Cloudflare', to: '/cloudflare' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} browser.style`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
      },
    }),
};

module.exports = config;
