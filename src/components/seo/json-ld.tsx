import type { Product as DBProduct } from "@/types/database";
import { CURRENCY } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ristoka.com";

/**
 * Organization JSON-LD for Ristoka (used in root layout)
 */
export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ristoka",
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    description:
      "Kenya's wholesale brokerage platform connecting wholesalers and retailers.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Swahili"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * WebSite JSON-LD with SearchAction (enables Google search box)
 */
export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ristoka",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface ProductWithWholesaler extends DBProduct {
  wholesalers?: { name: string; location: string | null } | null;
}

/**
 * Product JSON-LD for product detail pages
 */
export function ProductJsonLd({
  product,
}: {
  product: ProductWithWholesaler;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ??
      `${product.name} — wholesale at ${CURRENCY} ${product.price} per ${product.unit}`,
    ...(product.image_url ? { image: product.image_url } : {}),
    sku: product.id,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: product.wholesalers?.name ?? "Ristoka",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: "KES",
      price: product.is_flash_deal && product.flash_deal_price
        ? product.flash_deal_price
        : product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: product.wholesalers?.name ?? "Ristoka",
      },
      priceValidUntil: product.flash_deal_expires_at ?? undefined,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * BreadcrumbList JSON-LD
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
