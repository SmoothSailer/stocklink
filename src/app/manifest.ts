import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ristoka — Wholesale Brokerage Platform",
    short_name: "Ristoka",
    description:
      "Browse wholesale products, compare prices, and order via WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#16A34A",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
