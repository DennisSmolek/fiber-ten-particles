import type { NextConfig } from 'next';
const pagesBuild = process.env.PAGES_BUILD === 'true';
const config: NextConfig = {
  devIndicators: false,
  ...(pagesBuild ? {
    output: 'export',
    basePath: process.env.PAGES_BASE_PATH || '',
    trailingSlash: true,
  } : {}),
};
export default config;
