"use client";

import { useEffect, useMemo, useState } from "react";
import type { ToolRequest } from "@/lib/tools/whopAdmin";

type ToolAction = ToolRequest["type"];

const ACTIONS: Array<{
	value: ToolAction;
	label: string;
	requireCompanyId?: boolean;
	requireId?: boolean;
	requireProductId?: boolean;
	requireInput?: boolean;
}> = [
	{ value: "listProducts", label: "List Products", requireCompanyId: true },
	{ value: "createProduct", label: "Create Product", requireInput: true },
	{
		value: "updateProduct",
		label: "Update Product",
		requireId: true,
		requireInput: true,
	},
	{ value: "deleteProduct", label: "Delete Product", requireId: true },
	{
		value: "listPlans",
		label: "List Plans",
		requireCompanyId: true,
		requireProductId: true,
	},
	{ value: "createPlan", label: "Create Plan", requireInput: true },
	{
		value: "updatePlan",
		label: "Update Plan",
		requireId: true,
		requireInput: true,
	},
	{ value: "deletePlan", label: "Delete Plan", requireId: true },
];

const INPUT_TEMPLATES: Partial<Record<ToolAction, unknown>> = {
	createProduct: {
		companyId: "biz_***",
		name: "Signals Pro",
		description: "High-signal AI copilots for creators.",
		imageUrls: [],
		visibility: "visible",
	},
	updateProduct: {
		name: "Signals Pro (Updated)",
		description: "Iterated copy.",
	},
	createPlan: {
		companyId: "biz_***",
		productId: "prod_***",
		name: "VIP Monthly",
		priceCents: 9900,
		interval: "monthly",
		trialDays: 7,
	},
	updatePlan: {
		name: "VIP Annual",
		priceCents: 29900,
		interval: "annual",
	},
};

type ToolsPlaygroundProps = {
	writesEnabled: boolean;
};

export default function ToolsPlayground({
	writesEnabled,
}: ToolsPlaygroundProps) {
	const [action, setAction] = useState<ToolAction>("listProducts");
	const [companyId, setCompanyId] = useState("");
	const [productId, setProductId] = useState("");
	const [targetId, setTargetId] = useState("");
	const [inputValue, setInputValue] = useState("{}");
	const [response, setResponse] = useState<{
		status: number;
		body: unknown;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		const template = INPUT_TEMPLATES[action];
		if (template) {
			setInputValue(JSON.stringify(template, null, 2));
		} else if (!inputValue) {
			setInputValue("{}");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [action]);

	const selectedAction = useMemo(
		() => ACTIONS.find((item) => item.value === action)!,
		[action],
	);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setResponse(null);

		try {
			const body = buildPayload({
				action,
				companyId,
				productId,
				targetId,
				inputValue,
			});

			setPending(true);

			const res = await fetch("/api/tools", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await res.json().catch(() => ({}));
			setResponse({ status: res.status, body: data });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			setError(message);
		} finally {
			setPending(false);
		}
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-2">
				<label className="text-sm font-medium">Tool</label>
				<select
					className="rounded-lg border border-border/60 bg-white p-2"
					value={action}
					onChange={(event) => setAction(event.target.value as ToolAction)}
				>
					{ACTIONS.map((tool) => (
						<option key={tool.value} value={tool.value}>
							{tool.label}
						</option>
					))}
				</select>
			</div>

			{selectedAction.requireCompanyId ? (
				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium">Company ID</label>
					<input
						className="rounded-lg border border-border/60 p-2"
						value={companyId}
						onChange={(event) => setCompanyId(event.target.value)}
						placeholder="biz_***"
					/>
				</div>
			) : null}

			{selectedAction.requireProductId ? (
				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium">
						Product ID (optional)
					</label>
					<input
						className="rounded-lg border border-border/60 p-2"
						value={productId}
						onChange={(event) => setProductId(event.target.value)}
						placeholder="prod_***"
					/>
				</div>
			) : null}

			{selectedAction.requireId ? (
				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium">
						{action.includes("Product") ? "Product ID" : "Plan ID"}
					</label>
					<input
						className="rounded-lg border border-border/60 p-2"
						value={targetId}
						onChange={(event) => setTargetId(event.target.value)}
						placeholder={
							action.includes("Product") ? "prod_***" : "plan_***"
						}
					/>
				</div>
			) : null}

			{selectedAction.requireInput ? (
				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium">JSON Payload</label>
					<textarea
						className="min-h-[180px] rounded-lg border border-border/60 p-2 font-mono text-sm"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
					/>
					<p className="text-xs text-gray-500">
						Edit the payload before sending. Writes{" "}
						{writesEnabled
							? "will hit the API."
							: "are currently disabled."}
					</p>
				</div>
			) : null}

			<button
				type="submit"
				disabled={pending}
				className="rounded-lg bg-primary px-4 py-2 font-medium text-white disabled:opacity-60"
			>
				{pending ? "Running…" : "Run"}
			</button>

			{error ? <p className="text-sm text-red-600">{error}</p> : null}

			{response ? (
				<div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
					<p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
						Response ({response.status})
					</p>
					<pre className="overflow-auto text-sm">
						{JSON.stringify(response.body, null, 2)}
					</pre>
				</div>
			) : null}
		</form>
	);
}

function buildPayload({
	action,
	companyId,
	productId,
	targetId,
	inputValue,
}: {
	action: ToolAction;
	companyId: string;
	productId: string;
	targetId: string;
	inputValue: string;
}): ToolRequest {
	switch (action) {
		case "listProducts": {
			if (!companyId) throw new Error("companyId required");
			return { type: "listProducts", companyId };
		}
		case "createProduct":
			return { type: "createProduct", input: parseJSON(inputValue) };
		case "updateProduct": {
			if (!targetId) throw new Error("Product id required");
			return {
				type: "updateProduct",
				id: targetId,
				input: parseJSON(inputValue),
			};
		}
		case "deleteProduct": {
			if (!targetId) throw new Error("Product id required");
			return { type: "deleteProduct", id: targetId };
		}
		case "listPlans": {
			if (!companyId) throw new Error("companyId required");
			return {
				type: "listPlans",
				companyId,
				productId: productId || undefined,
			};
		}
		case "createPlan":
			return { type: "createPlan", input: parseJSON(inputValue) };
		case "updatePlan": {
			if (!targetId) throw new Error("Plan id required");
			return {
				type: "updatePlan",
				id: targetId,
				input: parseJSON(inputValue),
			};
		}
		case "deletePlan": {
			if (!targetId) throw new Error("Plan id required");
			return { type: "deletePlan", id: targetId };
		}
		default:
			throw new Error(`Unsupported action: ${action}`);
	}
}

function parseJSON(value: string) {
	try {
		const parsed = JSON.parse(value || "{}");
		if (typeof parsed !== "object" || parsed === null) {
			throw new Error("Payload must be an object");
		}
		return parsed;
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : "Invalid JSON payload",
		);
	}
}
