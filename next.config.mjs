import { withWhopAppConfig } from "@whop/react/next.config";

/** @type {import("next").NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [{ hostname: "**" }],
	},
	experimental: {
		swcPlugins: [],
	},
};

export default withWhopAppConfig(nextConfig);
