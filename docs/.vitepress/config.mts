import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Stoa',
  description: 'Commerce for humans and agents.',
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Stoa',

    nav: [
      { text: 'Guide', link: '/wiki/guide/introduction' },
      { text: 'API', link: '/wiki//api/overview' },
      { text: 'Plugins', link: '/wiki//plugins/overview' },
      { text: 'MCP', link: '/wiki//mcp/overview' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: '/wiki/changelog' },
          { text: 'GitHub', link: 'https://github.com/stoa-hq/stoa' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/wiki/guide/introduction' },
            { text: 'Quick Start', link: '/wiki/guide/quick-start' },
            { text: 'Configuration', link: '/wiki//guide/configuration' },
            { text: 'Self-Hosting', link: '/wiki/guide/self-hosting' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture', link: '/wiki/guide/architecture' },
            { text: 'Products & Variants', link: '/wiki/guide/products' },
            { text: 'Orders', link: '/wiki/guide/orders' },
            { text: 'Customers', link: '/wiki/guide/customers' },
          ]
        },
        {
          text: 'Admin Panel',
          items: [
            { text: 'Overview', link: '/wiki/guide/admin' },
            { text: 'Demo Storefront', link: '/wiki/guide/storefront' },
          ]
        }
      ],

      '/api/': [
        {
          text: 'REST API',
          items: [
            { text: 'Overview', link: '/wiki/api/overview' },
            { text: 'Authentication', link: '/wiki/api/authentication' },
            { text: 'Products', link: '/wiki/api/products' },
            { text: 'Orders', link: '/wiki/api/orders' },
            { text: 'Customers', link: '/wiki/api/customers' },
            { text: 'Cart', link: '/wiki/api/cart' },
          ]
        }
      ],

      '/plugins/': [
        {
          text: 'Plugin System',
          items: [
            { text: 'Overview', link: '/wiki/plugins/overview' },
            { text: 'Creating a Plugin', link: '/wiki/plugins/creating' },
            { text: 'Plugin API', link: '/wiki/plugins/api' },
            { text: 'Payment Providers', link: '/wiki/plugins/payment' },
            { text: 'Shipping Providers', link: '/wiki/plugins/shipping' },
          ]
        }
      ],

      '/mcp/': [
        {
          text: 'MCP',
          items: [
            { text: 'Overview', link: '/wiki/mcp/overview' },
            { text: 'Setup', link: '/wiki/mcp/setup' },
            { text: 'Available Tools', link: '/wiki/mcp/tools' },
            { text: 'Agent Examples', link: '/wiki/mcp/examples' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/stoa-hq/stoa' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Stoa Contributors'
    },

    search: {
      provider: 'local'
    }
  }
})
