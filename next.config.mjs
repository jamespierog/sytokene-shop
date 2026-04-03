import withMdkCheckout from "@moneydevkit/nextjs/next-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firebase client SDK uses some Node.js APIs that need to be
  // externalized when running in server components
  serverExternalPackages: ["firebase-admin"],
};

export default withMdkCheckout(nextConfig);
