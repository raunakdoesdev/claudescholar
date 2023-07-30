/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");
import tm from "next-transpile-modules";
import NextFederationPlugin from "@module-federation/nextjs-mf";

const withTM = tm(["@oloren/shared"]);

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  webpack: (config, { isServer }) => {
    // Important: return the modified config
    if (isServer) {
      config.externals.push({
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate",
      });
    }

    config.plugins.push(
      new NextFederationPlugin({
        name: "nextjsapp",
        // remotes: {
        //   next1: `next1@http://localhost:3001/_next/static/${
        //     isServer ? "ssr" : "chunks"
        //   }/remoteEntry.js`,
        // },
        filename: "static/chunks/remoteEntry.js",
        extraOptions: {},
      })
    );

    return config;
  },
};

export default withTM(config);
