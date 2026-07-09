import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

const SITE_NAME = 'MedicareInaya';
const SITE_URL  = 'https://www.medicareinaya.tn';
const DEFAULT_IMAGE = `${SITE_URL}/assets/images/logo.png`;
const DEFAULT_DESC  = 'Plateforme moderne de produits paramédicaux en Tunisie — Médicaments, Soins, Matériel médical.';

export interface SeoConfig {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleSvc = inject(Title);
  private meta     = inject(Meta);
  private router   = inject(Router);
  private document = inject(DOCUMENT);

  set(config: SeoConfig): void {
    const title       = `${config.title} | ${SITE_NAME}`;
    const description = config.description ?? DEFAULT_DESC;
    const image       = config.image ?? DEFAULT_IMAGE;
    const url         = config.url ?? `${SITE_URL}${this.router.url}`;

    // Basic
    this.titleSvc.setTitle(title);
    this.upsert('name',     'description',        description);
    this.upsert('name',     'robots', config.noIndex ? 'noindex,nofollow' : 'index,follow');

    // Open Graph (Facebook, WhatsApp, LinkedIn)
    this.upsert('property', 'og:type',        config.type ?? 'website');
    this.upsert('property', 'og:site_name',   SITE_NAME);
    this.upsert('property', 'og:title',       title);
    this.upsert('property', 'og:description', description);
    this.upsert('property', 'og:image',       image);
    this.upsert('property', 'og:url',         url);

    // Twitter Card
    this.upsert('name', 'twitter:card',        'summary_large_image');
    this.upsert('name', 'twitter:title',       title);
    this.upsert('name', 'twitter:description', description);
    this.upsert('name', 'twitter:image',       image);

    // Canonical
    this.setCanonical(url);
  }

  setProduct(p: {
    name_fr: string;
    name_ar?: string;
    description_fr?: string;
    images?: string[];
    price: number;
    stock_quantity: number;
    id?: number | string;
  }): void {
    const image = p.images?.[0] ?? DEFAULT_IMAGE;
    const url   = `${SITE_URL}/products/${p.id}`;

    this.set({
      title:       p.name_fr,
      description: p.description_fr?.slice(0, 155) || `${p.name_fr} — disponible sur MedicareInaya.`,
      image,
      url,
      type: 'product',
    });

    // JSON-LD structured data
    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name_fr,
      alternateName: p.name_ar,
      description: p.description_fr,
      image,
      url,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TND',
        price: p.price,
        availability: p.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: SITE_NAME },
      },
    });
  }

  reset(): void {
    this.set({ title: SITE_NAME.replace(/ \|.*/, ''), description: DEFAULT_DESC });
    this.removeJsonLd();
  }

  private upsert(attr: 'name' | 'property', key: string, value: string): void {
    if (this.meta.getTag(`${attr}="${key}"`)) {
      this.meta.updateTag({ [attr]: key, content: value });
    } else {
      this.meta.addTag({ [attr]: key, content: value });
    }
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(schema: object): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id   = 'json-ld-schema';
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(): void {
    this.document.getElementById('json-ld-schema')?.remove();
  }
}
