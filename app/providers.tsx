"use client";

import { ReactNode } from "react";
import { Theme } from "frosted-ui";
import { WhopApp } from "@whop/react/components";

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<Theme
			className="theme-whop"
			accentColor="orange"
			grayColor="sand"
			hasBackground={false}
		>
			<WhopApp>{children}</WhopApp>
		</Theme>
	);
}
