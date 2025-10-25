import { z } from "zod";
import { getWhopClient } from "@/lib/whop";

export const WRITES_DISABLED_ERROR = "Writes disabled (set ALLOW_WRITES=true)";
const WHOP_API_BASE = "https://api.whop.com/api/v1";
const allowWrites = process.env.ALLOW_WRITES === "true";

const ProductVisibilitySchema = z.enum([
	"visible",
	"hidden",
	"archived",
	"quick_link",
]);

export const ProductCreateInputSchema = z.object({
	companyId: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	imageUrls: z.array(z.string().url()).max(10).optional(),
	visibility: ProductVisibilitySchema.optional(),
});

export const ProductUpdateInputSchema =
	ProductCreateInputSchema.partial().refine(
		(data) => Object.keys(data).length > 0,
		"At least one field must be provided",
	);

export const ProductIdSchema = z.string().min(1);

const PlanIntervalSchema = z.enum(["monthly", "annual"]);

export const PlanCreateInputSchema = z.object({
	companyId: z.string().min(1),
	productId: z.string().min(1),
	name: z.string().optional(),
	description: z.string().optional(),
	priceCents: z.number().int().nonnegative(),
	interval: PlanIntervalSchema,
	trialDays: z.number().int().nonnegative().nullable().optional(),
});

export const PlanUpdateInputSchema = z
	.object({
		companyId: z.string().optional(),
		productId: z.string().optional(),
		name: z.string().optional(),
		description: z.string().optional(),
		priceCents: z.number().int().nonnegative().optional(),
		interval: PlanIntervalSchema.optional(),
		trialDays: z.number().int().nonnegative().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	});

export const PlanIdSchema = z.string().min(1);

const ToolRequestSchemaInternal = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("listProducts"),
		companyId: z.string().min(1),
	}),
	z.object({
		type: z.literal("createProduct"),
		input: ProductCreateInputSchema,
	}),
	z.object({
		type: z.literal("updateProduct"),
		id: ProductIdSchema,
		input: ProductUpdateInputSchema,
	}),
	z.object({
		type: z.literal("deleteProduct"),
		id: ProductIdSchema,
	}),
	z.object({
		type: z.literal("listPlans"),
		companyId: z.string().min(1),
		productId: z.string().optional(),
	}),
	z.object({
		type: z.literal("createPlan"),
		input: PlanCreateInputSchema,
	}),
	z.object({
		type: z.literal("updatePlan"),
		id: PlanIdSchema,
		input: PlanUpdateInputSchema,
	}),
	z.object({
		type: z.literal("deletePlan"),
		id: PlanIdSchema,
	}),
]);

export type ToolRequest = z.infer<typeof ToolRequestSchemaInternal>;
export const ToolRequestSchema = ToolRequestSchemaInternal;

type ToolResult<T> = { ok: true; data: T } | { ok: false; error: string };

function success<T>(data: T): ToolResult<T> {
	return { ok: true as const, data };
}

function failure(message: string): ToolResult<never> {
	return { ok: false as const, error: message };
}

type Connection<T> = {
	data?: Array<T | null> | null;
	nodes?: Array<T | null> | null;
	edges?: Array<{ node?: T | null } | null> | null;
};

function normalizeConnection<T>(
	connection: Connection<T> | Array<T | null> | undefined | null,
) {
	if (!connection) return [];
	const prune = (items?: Array<T | null> | null) =>
		Array.isArray(items) ? (items.filter(Boolean) as T[]) : [];

	if (Array.isArray(connection)) {
		return connection.filter(Boolean) as T[];
	}

	const data = prune(connection.data);
	if (data.length) return data;

	const nodes = prune(connection.nodes);
	if (nodes.length) return nodes;

	if (Array.isArray(connection.edges)) {
		return connection.edges
			.map((edge) => edge?.node ?? null)
			.filter(Boolean) as T[];
	}

	return [];
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message;
	return "Unknown error";
}

async function whopRest<T>(path: string, init?: RequestInit): Promise<T> {
	const apiKey = process.env.WHOP_API_KEY;

	if (!apiKey) {
		throw new Error("WHOP_API_KEY is not set");
	}

	const headers = new Headers(init?.headers);
	headers.set("Authorization", `Bearer ${apiKey}`);
	headers.set("Content-Type", "application/json");

	const response = await fetch(`${WHOP_API_BASE}${path}`, {
		...init,
		headers,
	});

	const text = await response.text();
	const payload = text ? (JSON.parse(text) as T) : (null as unknown as T);

	if (!response.ok) {
		const message =
			typeof payload === "object" &&
			payload !== null &&
			"message" in (payload as Record<string, unknown>) &&
			typeof (payload as Record<string, unknown>).message === "string"
				? (payload as Record<string, string>).message
				: text || response.statusText;

		throw new Error(message);
	}

	return payload;
}

function guardWrites(): ToolResult<never> | null {
	if (!allowWrites) {
		return failure(WRITES_DISABLED_ERROR);
	}

	return null;
}

function buildProductPayload(
	input: z.infer<typeof ProductCreateInputSchema>,
): Record<string, unknown> {
	return {
		company_id: input.companyId,
		name: input.name,
		description: input.description,
		image_urls: input.imageUrls,
		visibility: input.visibility,
	};
}

function buildPlanPayload(
	input: z.infer<typeof PlanCreateInputSchema>,
): Record<string, unknown> {
	return {
		company_id: input.companyId,
		product_id: input.productId,
		name: input.name,
		description: input.description,
		price_cents: input.priceCents,
		interval: input.interval,
		trial_days: input.trialDays ?? undefined,
	};
}

export async function listProducts(companyId: string) {
	try {
		const client = getWhopClient();
		const company = await client.companies.listAccessPasses({
			companyId,
		});

		const accessPasses = normalizeConnection(company?.accessPasses);

		return success(accessPasses);
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}

export async function createProduct(
	input: z.infer<typeof ProductCreateInputSchema>,
) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		const data = await whopRest("/products", {
			method: "POST",
			body: JSON.stringify(buildProductPayload(input)),
		});
		return success(data);
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}

export async function updateProduct(
	id: string,
	input: z.infer<typeof ProductUpdateInputSchema>,
) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		const payload: Record<string, unknown> = {};

		if (input.companyId) payload.company_id = input.companyId;
		if (input.name) payload.name = input.name;
		if (typeof input.description !== "undefined")
			payload.description = input.description;
		if (typeof input.imageUrls !== "undefined")
			payload.image_urls = input.imageUrls;
		if (typeof input.visibility !== "undefined")
			payload.visibility = input.visibility;

		const data = await whopRest(`/products/${id}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
		return success(data);
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}

export async function deleteProduct(id: string) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		await whopRest(`/products/${id}`, { method: "DELETE" });
		return success({ id });
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}

export async function listPlans(companyId: string, productId?: string) {
	try {
		const client = getWhopClient();
		const company = await client.companies.listPlans({
			companyId,
		});
		let plans = normalizeConnection(company?.plans);

		if (productId) {
			plans = plans.filter((plan) => {
				if (
					plan &&
					typeof plan === "object" &&
					"product" in plan &&
					plan.product &&
					typeof plan.product === "object" &&
					plan.product !== null
				) {
					return (plan.product as { id?: string }).id === productId;
				}
				return false;
			});
		}

		return success(plans);
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}

export async function createPlan(input: z.infer<typeof PlanCreateInputSchema>) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		const data = await whopRest("/plans", {
			method: "POST",
			body: JSON.stringify(buildPlanPayload(input)),
		});
		return success(data);
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}

export async function updatePlan(
	id: string,
	input: z.infer<typeof PlanUpdateInputSchema>,
) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		const payload: Record<string, unknown> = {};

		if (input.companyId) payload.company_id = input.companyId;
		if (input.productId) payload.product_id = input.productId;
		if (input.name) payload.name = input.name;
		if (typeof input.description !== "undefined")
			payload.description = input.description;
		if (typeof input.priceCents !== "undefined")
			payload.price_cents = input.priceCents;
		if (typeof input.interval !== "undefined")
			payload.interval = input.interval;
		if (typeof input.trialDays !== "undefined")
			payload.trial_days = input.trialDays;

		const data = await whopRest(`/plans/${id}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
		return success(data);
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}

export async function deletePlan(id: string) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		await whopRest(`/plans/${id}`, { method: "DELETE" });
		return success({ id });
	} catch (error) {
		return failure(getErrorMessage(error));
	}
}
