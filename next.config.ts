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
      // Production-only optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Prisma chunk (this is likely causing your memory issues)
          'prisma-vendor': {
            test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
            name: 'prisma-vendor',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          // Wagmi/viem chunk (heavy blockchain libraries)
          'blockchain-vendor': {
            test: /[\\/]node_modules[\\/](wagmi|@wagmi|viem|@tanstack)[\\/]/,
            name: 'blockchain-vendor',
            chunks: 'all',
            priority: 15,
          },
          // React chunk
          'react-vendor': {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react-vendor',
            chunks: 'all',
            priority: 10,
          },
          // Lucide icons chunk
          'lucide-vendor': {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide-vendor',
            chunks: 'all',
            priority: 8,
          },
          // General vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 5,
          },
        },
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
