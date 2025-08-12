import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set the port for the Next.js app
  env: {
    PORT: '4000'
  },
  
  // Enable Turbopack for faster development builds
  turbopack: {
    // Configure module resolution for better performance
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    
    // Configure aliases for cleaner imports and better performance
    resolveAlias: {
      '@': './',
      '@/components': './components',
      '@/hooks': './hooks',
      '@/lib': './lib',
      '@/context': './context',
      '@/app': './app',
      
      // Conditional aliases for better browser optimization
      'react': { browser: 'react' },
      'react-dom': { browser: 'react-dom' },
      
      // Performance optimizations for common libraries
      'lodash': 'lodash-es',
    },
  },
  
  // Keep existing webpack configuration for production builds
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  
  // Additional optimizations for development and production
  experimental: {
    // Enable React compiler for better performance (disable in dev for faster builds)
    reactCompiler: process.env.NODE_ENV === 'production',
    

    
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@wagmi/core',
      'viem',
      'socket.io-client'
    ],
    
    // Enable server components HMR cache for better performance
    serverComponentsHmrCache: true,
  },
  
  // Performance optimizations
  compress: true,
  
  // Build optimizations
  swcMinify: true,
  
  // Enable production source maps for debugging
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
