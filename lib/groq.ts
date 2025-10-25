const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/responses";

type GroqResponse = Record<string, unknown>;

async function groqResponses(body: unknown): Promise<GroqResponse> {
	const apiKey = process.env.GROQ_API_KEY;

	if (!apiKey) {
		throw new Error("GROQ_API_KEY is not set");
	}

	const response = await fetch(GROQ_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => "");
		throw new Error(
			`Groq request failed (${response.status}): ${
				errorText || response.statusText
			}`,
		);
	}

	return (await response.json()) as GroqResponse;
}

async function compoundModelRequest(
	model: "groq/compound-mini" | "groq/compound",
	input: unknown,
	tools?: unknown[],
): Promise<GroqResponse> {
	const payload: Record<string, unknown> = {
		model,
		input,
	};

	if (tools && tools.length > 0) {
		payload.tools = tools;
	}

	return groqResponses(payload);
}

export async function compoundMini(
	input: unknown,
	tools?: unknown[],
): Promise<GroqResponse> {
	return compoundModelRequest("groq/compound-mini", input, tools);
}

export async function compound(
	input: unknown,
	tools?: unknown[],
): Promise<GroqResponse> {
	return compoundModelRequest("groq/compound", input, tools);
}

export { groqResponses };
