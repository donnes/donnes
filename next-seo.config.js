const seo = {
  title: 'Donald Silveira | Frontend Engineer',
  defaultTitle: 'Donald Silveira | Frontend Engineer',
  description:
    'Helping companies build and maintain large-scale web and mobile applications for over a decade.',
  canonical: 'https://donnes.vercel.app',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://donnes.vercel.app',
    site_name: 'Donald Silveira | Frontend Engineer',
    images: [
      {
        url: '/open-graphs.png',
        width: 1200,
        height: 630,
        alt: 'Donald Silveira | Frontend Engineer',
      },
    ],
  },
  twitter: {
    handle: '@donaldsilveira',
    site: '@donaldsilveira',
    cardType: 'summary_large_image',
  },
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-57x57.png',
      sizes: '57x57',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-60x60.png',
      sizes: '60x60',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-72x72.png',
      sizes: '72x72',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-76x76.png',
      sizes: '76x76',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-114x114.png',
      sizes: '114x114',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-120x120.png',
      sizes: '120x120',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-144x144.png',
      sizes: '144x144',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-152x152.png',
      sizes: '152x152',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-icon-180x180.png',
      sizes: '180x180',
    },
    {
      rel: 'icon',
      href: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      rel: 'icon',
      href: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      rel: 'icon',
      href: '/favicon-32x32.png',
      sizes: '32x32',
      type: 'image/png',
    },
    {
      rel: 'icon',
      href: '/favicon-16x16.png',
      sizes: '16x16',
      type: 'image/png',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],
  additionalMetaTags: [
    {
      name: 'msapplication-TileColor',
      content: '#ffffff',
    },
    {
      name: 'msapplication-TileImage',
      content: '/static/favicon/ms-icon-144x144.png',
    },
    {
      name: 'theme-color',
      content: '#ffffff',
    },
  ],
}

export default seo
