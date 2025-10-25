import { Badge, Card, Heading, Separator, Text } from "frosted-ui";

const kpis = [
	{
		label: "Chats (7d)",
		value: "182",
		helper: "+38% WoW",
	},
	{
		label: "Completion Rate",
		value: "94%",
		helper: "Guided flows",
	},
	{
		label: "Avg Steps",
		value: "4.2",
		helper: "per conversation",
	},
	{
		label: "Created Items (7/30d)",
		value: "21 / 88",
		helper: "Posts & plans",
	},
] as const;

const activities = [
	{
		title: "Prompt refresh published",
		meta: "Yesterday · By Haley",
	},
	{
		title: "5 new workflows enabled",
		meta: "2 days ago · Builder automation",
	},
	{
		title: "Creator success summary exported",
		meta: "3 days ago · Dashboard",
	},
] as const;

export default function DashboardPage({
	params,
}: {
	params: { companyId: string };
}) {
	return (
		<div className="px-4 py-8 lg:px-8">
			<div className="mx-auto flex max-w-[1200px] flex-col gap-6">
				<header className="glass-panel rounded-3xl border border-border/40 px-6 py-5">
					<Text size="2" color="gray" className="uppercase tracking-wide">
						Dashboard overview
					</Text>
					<Heading size="6" className="mt-2 text-foreground">
						Analytics · {params.companyId}
					</Heading>
					<Text size="3" color="gray">
						Track how creators collaborate with WhopGPT.
					</Text>
				</header>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{kpis.map((kpi) => (
						<Card
							key={kpi.label}
							className="glass-panel border border-border/40 p-5 shadow-sm"
						>
							<Text size="2" color="gray">
								{kpi.label}
							</Text>
							<Heading size="5" className="mt-2 text-foreground">
								{kpi.value}
							</Heading>
							<Text size="2" color="gray">
								{kpi.helper}
							</Text>
						</Card>
					))}
				</section>

				<section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
					<Card className="glass-panel border border-border/40 p-5">
						<div className="flex items-center justify-between">
							<Heading size="4">Recent Activity</Heading>
							<Badge color="orange" variant="soft">
								Live
							</Badge>
						</div>
						<div className="mt-4 space-y-4">
							{activities.map((activity, index) => (
								<div key={activity.title}>
									<Text size="3" weight="medium">
										{activity.title}
									</Text>
									<Text size="2" color="gray">
										{activity.meta}
									</Text>
									{index < activities.length - 1 ? (
										<Separator className="mt-3 opacity-40" />
									) : null}
								</div>
							))}
						</div>
					</Card>

					<Card className="glass-panel border border-border/40 p-5">
						<Heading size="4">Heads up</Heading>
						<Text size="2" color="gray" className="mt-2">
							This panel is ready for insights in a later milestone. Keep an eye
							out for experiment summaries and quality flags.
						</Text>
					</Card>
				</section>
			</div>
		</div>
	);
}
