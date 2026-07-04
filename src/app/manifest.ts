import type { MetadataRoute } from "next"
import { SITE_DESCRIPTION, SITE_NAME, SQUARE_IMAGE } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Portfolio Blog",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f1e7",
    theme_color: "#1f1f1d",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: SQUARE_IMAGE,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
