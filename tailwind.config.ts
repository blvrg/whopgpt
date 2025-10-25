import { frostedThemePlugin } from "@whop/react/tailwind";
import type { Config } from "tailwindcss";

const config = {
	theme: {
		extend: {
			colors: {
				primary: "var(--color-dragon-fire)",
				midnight: "var(--color-midnight)",
				surface: "var(--color-surface)",
				foreground: "var(--color-foreground)",
				muted: "var(--color-foreground-muted)",
				border: "var(--color-border-soft)",
			},
		},
	},
	plugins: [frostedThemePlugin()],
} satisfies Config;

export default config;
