import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	WRITES_DISABLED_ERROR,
	createPlan,
	createProduct,
	deletePlan,
	deleteProduct,
	listPlans,
	listProducts,
	ToolRequest,
	ToolRequestSchema,
	updatePlan,
	updateProduct,
} from "@/lib/tools/whopAdmin";

type ToolResult =
	| { ok: true; data: unknown }
	| { ok: false; error: string };

function toStatus(result: ToolResult) {
	if (result.ok) return 200;
	if (result.error === WRITES_DISABLED_ERROR) return 403;
	return 400;
}

export async function POST(request: Request) {
	let payload: ToolRequest;

	try {
		const json = await request.json();
		payload = ToolRequestSchema.parse(json);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json(
				{
					ok: false,
					error: error.issues.map((issue) => issue.message).join(", "),
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ ok: false, error: "Invalid JSON body" },
			{ status: 400 },
		);
	}

	try {
		let result: ToolResult;

		switch (payload.type) {
			case "listProducts":
				result = await listProducts(payload.companyId);
				break;
			case "createProduct":
				result = await createProduct(payload.input);
				break;
			case "updateProduct":
				result = await updateProduct(payload.id, payload.input);
				break;
			case "deleteProduct":
				result = await deleteProduct(payload.id);
				break;
			case "listPlans":
				result = await listPlans(payload.companyId, payload.productId);
				break;
			case "createPlan":
				result = await createPlan(payload.input);
				break;
			case "updatePlan":
				result = await updatePlan(payload.id, payload.input);
				break;
			case "deletePlan":
				result = await deletePlan(payload.id);
				break;
			default:
				result = { ok: false, error: "Unknown tool request" };
				break;
		}

		return NextResponse.json(result, {
			status: toStatus(result),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ ok: false, error: message },
			{ status: 500 },
		);
	}
}
