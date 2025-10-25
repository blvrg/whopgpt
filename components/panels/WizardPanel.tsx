"use client";

import { Button, Card, Heading, Progress, Text } from "frosted-ui";

export function WizardPanel() {
	return (
		<Card className="glass-panel flex flex-col gap-4 border border-border/40">
			<div className="flex items-start justify-between">
				<div>
					<Heading size="3">Wizard Progress</Heading>
					<Text size="2" color="gray">
						0 / 5 steps complete
					</Text>
				</div>
				<Text size="2" color="gray">
					Step 1
				</Text>
			</div>
			<Progress value={0} max={5} color="orange" className="w-full" />
			<Button variant="solid" color="orange" disabled className="w-full">
				Confirm
			</Button>
		</Card>
	);
}
