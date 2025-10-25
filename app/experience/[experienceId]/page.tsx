import { Heading, Text } from "frosted-ui";
import Link from "next/link";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ContextPanel } from "@/components/panels/ContextPanel";
import { WizardPanel } from "@/components/panels/WizardPanel";

const mockMessages = [
	{
		role: "creator",
		content:
			"Our onboarding prompt should feel more energetic. Can you rewrite it?",
		timestamp: "10:02 AM",
	},
	{
		role: "assistant",
		content:
			"Absolutely! I'll highlight the value props, shorten the first sentence, and weave in the trading product context.",
		timestamp: "10:03 AM",
	},
	{
		role: "creator",
		content:
			"Perfect — and mention the VIP signals plan. Keep the CTA friendly.",
		timestamp: "10:04 AM",
	},
	{
		role: "assistant",
		content:
			"Done! Draft ready below. Let me know if you’d like a carousel version or a version for Discord announcements.",
		timestamp: "10:05 AM",
	},
] as const;

export default function ExperiencePage({
	params,
}: {
	params: { experienceId: string };
}) {
	const { experienceId } = params;
	const showDevToolsLink = process.env.NODE_ENV === "development";

	return (
		<div className="px-4 py-6 lg:px-8">
			<div className="mx-auto flex max-w-[1400px] flex-col gap-6">
				<header className="glass-panel flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-border/40 px-6 py-5">
					<div className="space-y-1">
						<Text
							size="2"
							color="gray"
							className="uppercase tracking-wide"
						>
							Company / Experience
						</Text>
						<Heading size="6" className="text-foreground">
							WhopGPT
						</Heading>
						<Text size="3" color="gray">
							Wizard Playground · {experienceId}
						</Text>
					</div>
					{showDevToolsLink ? (
						<Link
							href="/dev/tools"
							className="rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
						>
							Dev Tools
						</Link>
					) : null}
				</header>

				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
					<section className="glass-panel relative flex min-h-[70vh] flex-col gap-4 rounded-3xl border border-border/50 p-5 shadow-lg shadow-midnight/5">
						<div className="flex flex-col gap-2">
							<Text size="2" color="gray">
								Chat
							</Text>
							<Heading size="4">Creator thread</Heading>
						</div>

						<div className="flex grow flex-col gap-4">
							<div className="flex-1 space-y-4 overflow-y-auto pr-1">
								{mockMessages.map((message) => (
									<ChatMessage
										key={`${message.role}-${message.timestamp}`}
										role={message.role}
										content={message.content}
										timestamp={message.timestamp}
									/>
								))}
							</div>
							<div className="sticky bottom-0 pt-2">
								<ChatComposer />
							</div>
						</div>
					</section>

					<aside className="space-y-3 lg:sticky lg:top-6">
						<div className="hidden lg:block">
							<PanelsStack />
						</div>
						<details className="glass-panel rounded-3xl border border-border/60 px-4 py-3 text-sm lg:hidden">
							<summary className="cursor-pointer font-medium text-foreground">
								Open workspace panels
							</summary>
							<div className="mt-4">
								<PanelsStack />
							</div>
						</details>
					</aside>
				</div>
			</div>
		</div>
	);
}

function PanelsStack() {
	return (
		<div className="flex flex-col gap-4">
			<WizardPanel />
			<ContextPanel />
		</div>
	);
}
