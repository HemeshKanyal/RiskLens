import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The ZK prover libraries only run in the browser (identity check page).
  // Keep their Node builds out of the server bundle.
  serverExternalPackages: ["@aztec/bb.js", "@noir-lang/noir_js"],

  // Cross-origin isolation lets the in-browser prover use multiple threads
  // (SharedArrayBuffer). `credentialless` still allows cross-origin requests
  // that don't send cookies, such as the prover's public parameter download.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
