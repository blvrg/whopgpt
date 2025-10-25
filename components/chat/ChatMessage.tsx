import { Badge, Card, Text } from "frosted-ui";

type ChatRole = "creator" | "assistant";

export type ChatMessageProps = {
	role: ChatRole;
	content: string;
	timestamp?: string;
};

const roleCopy: Record<ChatRole, string> = {
	creator: "Creator",
	assistant: "WhopGPT",
};

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
	const isAssistant = role === "assistant";

	return (
		<Card
			className={`border border-border/40 shadow-sm backdrop-blur ${
				isAssistant
					? "bg-primary/5 text-foreground"
					: "bg-white/90 text-foreground"
			}`}
		>
			<div className="mb-2 flex items-center gap-2">
				<Badge
					variant={isAssistant ? "solid" : "outline"}
					color="orange"
					className="uppercase tracking-wide"
				>
					{roleCopy[role]}
				</Badge>
				{timestamp ? (
					<Text size="1" color="gray">
						{timestamp}
					</Text>
				) : null}
			</div>
			<Text as="p" size="3">
				{content}
			</Text>
		</Card>
	);
}
