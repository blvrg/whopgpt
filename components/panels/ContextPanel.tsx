"use client";

import { Card, Heading, Separator, Text } from "frosted-ui";

const contextRows = [
	{ label: "Selected product", value: "Signals Pro" },
	{ label: "Plan", value: "Pro • $149/mo" },
	{ label: "Audience", value: "Crypto Creators" },
	{ label: "Priority", value: "High" },
];

export function ContextPanel() {
	return (
		<Card className="glass-panel border border-border/40">
			<Heading size="3" className="mb-3">
				Context
			</Heading>
			<div className="space-y-3">
				{contextRows.map((row, index) => (
					<div key={row.label}>
						<div className="flex items-center justify-between text-sm">
							<Text size="2" color="gray">
								{row.label}
							</Text>
							<Text size="2" weight="medium">
								{row.value}
							</Text>
						</div>
						{index < contextRows.length - 1 ? (
							<Separator className="mt-2 opacity-40" />
						) : null}
					</div>
				))}
			</div>
		</Card>
	);
}
