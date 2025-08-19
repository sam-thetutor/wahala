import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  
  // Optimized webpack configuration for production builds
  webpack: (config, { isServer, dev }) => {
    // Keep existing externals
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    if (!isServer && !dev) {
      // Production-only optimizations with cleaner chunk splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // React chunk (highest priority)
          'react-vendor': {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react-vendor',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          // Lucide icons chunk
          'lucide-vendor': {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide-vendor',
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          // Wagmi/viem chunk (blockchain libraries)
          'wagmi-vendor': {
            test: /[\\/]node_modules[\\/](wagmi|@wagmi|viem|@tanstack)[\\/]/,
            name: 'wagmi-vendor',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          // Prisma chunk
          'prisma-vendor': {
            test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
            name: 'prisma-vendor',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
          // Framer Motion chunk
          'framer-vendor': {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-vendor',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          // Socket.io chunk
          'socket-vendor': {
            test: /[\\/]node_modules[\\/]socket\.io-client[\\/]/,
            name: 'socket-vendor',
            chunks: 'all',
            priority: 8,
            enforce: true,
          },
          // General vendor chunk (lowest priority)
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
        // Increase chunk size warning limit (similar to Vite's chunkSizeWarningLimit)
        maxSize: 1000000, // 1MB in bytes
      }
    }
    
    return config;
  },
  
  // Additional optimizations for development and production
  experimental: {
    // Enable React compiler for better performance
    reactCompiler: true,
    
    // Enable server components HMR cache for better performance
    serverComponentsHmrCache: true,
  },
  
  // Performance optimizations
  compress: true,
  
  // Enable production source maps for debugging
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
