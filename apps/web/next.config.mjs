/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the whole site becomes plain HTML/CSS/JS for GitHub Pages.
  // No server, no secrets in this bundle — only NEXT_PUBLIC_* env vars.
  output: "export",
  images: { unoptimized: true }, // required for static export
  trailingSlash: true,
  // When deploying to username.github.io/portfolio, the CI sets
  // NEXT_BASE_PATH=/portfolio so asset + link paths stay correct.
  ...(process.env.NEXT_BASE_PATH
    ? { basePath: process.env.NEXT_BASE_PATH }
    : {}),
};

export default nextConfig;
