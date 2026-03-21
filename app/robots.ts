import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/setup', '/tracks', '/settings', '/series', '/api/'],
    },
    sitemap: 'https://irsp.app/sitemap.xml',
  }
}
