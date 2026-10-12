/**
 * PWA Plugin for Grok App Builder
 * Injects PWA metadata and handles the install tutorial page.
 */
export function grokPwaPlugin() {
  return {
    name: "grok:pwa-plugin",
    apply: "serve",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: { name: "theme-color", content: "#050b16" },
          injectTo: "head",
        },
        {
          tag: "link",
          attrs: { rel: "manifest", href: "/site.webmanifest" },
          injectTo: "head",
        },
      ];
    },
  };
}
