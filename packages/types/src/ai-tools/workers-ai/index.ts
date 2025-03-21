export type cloudflareModelTypes = keyof typeof workersAiCatalog.modelGroups;
export type cloudflareModelPossibilitiesRaw<M extends cloudflareModelTypes = cloudflareModelTypes> = (typeof workersAiCatalog.modelGroups)[M]['models'][number];
export type cloudflareModelPossibilities<M extends cloudflareModelTypes = cloudflareModelTypes> = cloudflareModelPossibilitiesRaw<M>['name'];
