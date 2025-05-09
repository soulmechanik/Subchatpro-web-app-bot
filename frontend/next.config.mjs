/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      JWT_SECRET: process.env.JWT_SECRET, // 👈 expose JWT_SECRET to middleware
    },
  };
  
  export default nextConfig;
  