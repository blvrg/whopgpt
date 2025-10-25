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

type Connection<T> = {
	data?: T[];
	nodes?: T[];
	edges?: Array<{ node?: T }>;
};

function normalizeConnection<T>(connection: Connection<T> | T[] | undefined) {
	if (!connection) return [];
	if (Array.isArray(connection)) return connection;
	if (Array.isArray(connection.data)) return connection.data;
	if (Array.isArray(connection.nodes)) return connection.nodes;
	if (Array.isArray(connection.edges)) {
		return connection.edges.map((edge) => edge?.node).filter(Boolean) as T[];
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
		return { ok: false, error: WRITES_DISABLED_ERROR };
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
		const variables: Record<string, string> = { companyId };
		const company = await client.companies.listAccessPasses(variables);

		const accessPasses = normalizeConnection(company?.accessPasses);

		return { ok: true, data: accessPasses } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
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
		return { ok: true, data } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
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
		return { ok: true, data } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
	}
}

export async function deleteProduct(id: string) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		await whopRest(`/products/${id}`, { method: "DELETE" });
		return { ok: true, data: { id } } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
	}
}

export async function listPlans(companyId: string, productId?: string) {
	try {
		const client = getWhopClient();
		const variables: Record<string, string> = { companyId };
		if (productId) variables.productId = productId;
		const company = await client.companies.listPlans(variables);
		const plans = normalizeConnection(company?.plans);
		return { ok: true, data: plans } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
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
		return { ok: true, data } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
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
		return { ok: true, data } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
	}
}

export async function deletePlan(id: string) {
	const guardResult = guardWrites();
	if (guardResult) return guardResult;

	try {
		await whopRest(`/plans/${id}`, { method: "DELETE" });
		return { ok: true, data: { id } } satisfies ToolResult<unknown>;
	} catch (error) {
		return { ok: false, error: getErrorMessage(error) };
	}
}
