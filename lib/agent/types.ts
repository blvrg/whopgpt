export type ProductVisibility =
	| "visible"
	| "hidden"
	| "archived"
	| "quick_link";

export type ProductSlots = {
	name?: string;
	description?: string;
	imageUrls?: string[];
	visibility?: ProductVisibility;
	companyId?: string;
};

export type PlanInterval = "monthly" | "annual";

export type PlanSlots = {
	productId?: string;
	name?: string;
	description?: string;
	priceCents?: number;
	interval?: PlanInterval;
	trialDays?: number | null;
	companyId?: string;
};

export type Intent =
	| { kind: "listProducts"; companyId: string }
	| { kind: "createProduct"; slots: ProductSlots }
	| { kind: "updateProduct"; id: string; slots: ProductSlots }
	| { kind: "deleteProduct"; id: string }
	| { kind: "listPlans"; companyId: string; productId?: string }
	| { kind: "createPlan"; slots: PlanSlots }
	| { kind: "updatePlan"; id: string; slots: PlanSlots }
	| { kind: "deletePlan"; id: string };
