/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  
  // ✅ CONFIGURACIÓN PARA PDF.JS (SOLO WEBPACK)
  webpack: (config, { isServer }) => {
    // Solo aplicar en el cliente
    if (!isServer) {
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/worker/[hash][ext][query]'
        }
      });
    }
    
    return config;
  },
  
  // ✅ REMOVER experimental.esmExternals (NO COMPATIBLE CON TURBOPACK)
  // experimental: {
  //   esmExternals: 'loose'
  // },
  
  // ✅ CONFIGURACIÓN ADICIONAL PARA EVITAR ERRORES DE SSR
  transpilePackages: ['pdfjs-dist'],
  
  // ✅ HEADERS DE SEGURIDAD (OPCIONAL - PARA MEJOR COMPATIBILIDAD)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;