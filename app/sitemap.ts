import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    '',
    'dashboard',
    'near-me',
    'notifications',
    'login',
    'register',
    'report',
  ];

  return routes.map((path) => ({
    url: `${siteUrl}/${path}`.replace(/\/$/, '/'),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
