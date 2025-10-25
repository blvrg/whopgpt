"use client";

import { useState } from "react";
import { Button, TextArea } from "frosted-ui";

export function ChatComposer() {
	const [message, setMessage] = useState("");
	const [status, setStatus] = useState<"idle" | "sending">("idle");

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!message.trim()) {
			return;
		}

		setStatus("sending");

		// Placeholder async to mimic outbound call
		await new Promise((resolve) => setTimeout(resolve, 300));
		setMessage("");
		setStatus("idle");
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-white/80 p-3 shadow-sm shadow-primary/10 backdrop-blur dark:bg-midnight/80"
		>
			<TextArea
				value={message}
				onChange={(event) => setMessage(event.target.value)}
				placeholder="Draft the next assistant response..."
				rows={3}
				variant="surface"
				color="orange"
			/>
			<div className="flex items-center justify-end gap-2">
				<Button
					type="submit"
					variant="solid"
					color="orange"
					disabled={status === "sending" || !message.trim()}
					loading={status === "sending"}
				>
					Send
				</Button>
			</div>
		</form>
	);
}
