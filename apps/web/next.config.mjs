/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the whole site becomes plain HTML/CSS/JS for GitHub Pages.
  // No server, no secrets in this bundle — only NEXT_PUBLIC_* env vars.
  output: "export",
  images: { unoptimized: true }, // required for static export
  trailingSlash: true,
  // If serving from a project subpath (username.github.io/portfolio), set:
  // basePath: "/portfolio",
};

export default nextConfig;
