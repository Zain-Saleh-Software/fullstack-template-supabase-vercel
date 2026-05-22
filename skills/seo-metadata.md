# SEO & Metadata Skill (Vercel + Supabase Stack)

**Description:** Patterns for Next.js Metadata API, Open Graph images, Twitter Cards, sitemaps, structured data, and SEO best practices.
**Role:** The Executor

---

## 1. Metadata API

Next.js exports a `Metadata` API from both layouts and pages. Always use it.

### Static Metadata

```typescript
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App — CRM Solution',
  },
  description: 'A powerful CRM solution built with Next.js and Supabase.',
  metadataBase: new URL('https://my-app.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'ar': '/ar',
    },
  },
  openGraph: {
    title: 'My App — CRM Solution',
    description: 'A powerful CRM solution built with Next.js and Supabase.',
    url: 'https://my-app.vercel.app',
    siteName: 'My App',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'My App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My App — CRM Solution',
    description: 'A powerful CRM solution built with Next.js and Supabase.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

### Dynamic Metadata (generateMetadata)

```typescript
// src/app/[locale]/items/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    return {
      title: 'Not Found',
      description: 'The requested item could not be found.',
    };
  }

  return {
    title: item.name,
    description: item.description ?? `Details for ${item.name}`,
    openGraph: {
      title: item.name,
      description: item.description,
      images: item.imageUrl ? [{ url: item.imageUrl }] : undefined,
    },
  };
}
```

---

## 2. Title Template Pattern

The root layout sets a template; pages set the dynamic part:

```typescript
// Root layout
export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App',
  },
};

// Any page — just the page-specific part
export const metadata: Metadata = {
  title: 'Dashboard', // Renders: "Dashboard | My App"
};
```

---

## 3. Open Graph & Twitter Cards

Always include both for social sharing:

```typescript
const sharedMeta = {
  title: 'My App',
  description: 'Description here',
  images: [
    {
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'My App preview',
    },
  ],
};

export const metadata: Metadata = {
  openGraph: {
    ...sharedMeta,
    url: 'https://my-app.vercel.app',
    siteName: 'My App',
    locale: 'en_US',
    type: 'website', // or 'article', 'profile', etc.
  },
  twitter: {
    ...sharedMeta,
    card: 'summary_large_image',
  },
};
```

### OG Image Quick Reference
- Size: 1200 × 630 pixels (1.91:1 ratio)
- Format: PNG or JPEG
- Max file size: 8 MB
- Use a tool like [Vercel OG](https://vercel.com/docs/functions/og-image-generation) for dynamic OG images

---

## 4. Sitemap

### Static Sitemap

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://my-app.vercel.app';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/ar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}
```

### Dynamic Sitemap

```typescript
// src/app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://my-app.vercel.app';
  const items = await db.select().from(items).where(eq(items.isDeleted, false));

  const itemUrls = items.map((item) => ({
    url: `${baseUrl}/en/items/${item.id}`,
    lastModified: item.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...itemUrls,
  ];
}
```

---

## 5. Robots.txt

```typescript
// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/'],
    },
    sitemap: 'https://my-app.vercel.app/sitemap.xml',
  };
}
```

---

## 6. Canonical URLs

```typescript
// For pages that exist in multiple locales
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        ar: '/ar',
      },
    },
  };
}
```

---

## 7. Structured Data (JSON-LD)

```tsx
// In a page or component
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description,
    image: item.imageUrl,
    offers: {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>{item.name}</h1>
      {/* rest of page */}
    </>
  );
}
```

**Note:** `dangerouslySetInnerHTML` here is safe because the data comes from your own database, not user input.

---

## 8. Not-Found (404) Metadata

```typescript
// src/app/[locale]/not-found.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <h1>404 — Page Not Found</h1>;
}
```

---

## 9. Favicon & App Icons

Place in `src/app/` (Next.js auto-discovers):

```
src/app/
├── icon.ico          (favicon)
├── icon.png          (app icon)
├── apple-icon.png    (Apple touch icon)
├── icon.svg          (vector favicon — preferred)
├── opengraph-image.png (default OG image)
└── twitter-image.png   (default Twitter image)
```

No need to add `<link>` tags — Next.js generates them automatically.

---

## 10. SEO Checklist

- [ ] Every page has a `<title>` (via metadata export or generateMetadata)
- [ ] Every page has a `description` meta tag
- [ ] `metadataBase` set to production URL
- [ ] Open Graph tags on all pages
- [ ] Twitter Card tags on all pages
- [ ] Canonical URLs set correctly
- [ ] Alternate language URLs documented (hreflang)
- [ ] Sitemap generated and accessible (`/sitemap.xml`)
- [ ] Robots.txt configured (`/robots.txt`)
- [ ] Structured data (JSON-LD) on relevant pages
- [ ] OG image (1200×630) for social sharing
- [ ] Favicon and app icons in `src/app/`
- [ ] 404 page has `robots: { index: false }`
- [ ] No duplicate content across locale variants (use canonical + hreflang)
- [ ] Semantic HTML used throughout (helps search engines)
