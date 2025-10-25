import { WhopServerSdk } from "@whop/api";

let whopSingleton: ReturnType<typeof WhopServerSdk> | undefined;

function createWhopClient() {
	const appId = process.env.WHOP_APP_ID;
	const apiKey = process.env.WHOP_API_KEY;

	if (!appId) {
		throw new Error("WHOP_APP_ID is not set");
	}

	if (!apiKey) {
		throw new Error("WHOP_API_KEY is not set");
	}

	return WhopServerSdk({
		appId,
		appApiKey: apiKey,
	});
}

export function getWhopClient() {
	if (!whopSingleton) {
		whopSingleton = createWhopClient();
	}

	return whopSingleton;
}

export const whop = new Proxy(
	{},
	{
		get(_target, property) {
			const client = getWhopClient() as Record<PropertyKey, unknown>;
			return client[property];
		},
	},
) as ReturnType<typeof WhopServerSdk>;
