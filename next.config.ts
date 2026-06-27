import type { NextConfig } from "next";

/**
 * O backend PersonalRouter (Spring Boot) não expõe CORS, então todas as
 * chamadas do browser passam pelo mesmo origin (`/api/*`) e o Next reescreve
 * para o backend no servidor. Configure `BACKEND_URL` para apontar para outra
 * instância (default: http://localhost:8080).
 */
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
