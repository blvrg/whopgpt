import { notFound } from "next/navigation";
import { Suspense } from "react";

import ToolsPlayground from "./playground";

export default function DevToolsPage() {
	if (process.env.NODE_ENV !== "development") {
		notFound();
	}

	const writesEnabled = process.env.ALLOW_WRITES === "true";

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
			<div className="space-y-2">
				<h1 className="text-3xl font-semibold">Tool Harness</h1>
				<p className="text-sm text-gray-500">
					Ad hoc runner for the Compound tools layer. Requests are proxied
					through <code>/api/tools</code>.
				</p>
				<p className="text-xs text-gray-500">
					Writes {writesEnabled ? "enabled" : "disabled"}
				</p>
			</div>
			<Suspense fallback={<div>Loading…</div>}>
				<ToolsPlayground writesEnabled={writesEnabled} />
			</Suspense>
		</div>
	);
}
