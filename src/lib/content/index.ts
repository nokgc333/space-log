import { site as rawSite } from "@content/site";

import { siteSchema } from "./schema";

export const site = siteSchema.parse(rawSite);

export type * from "./schema";
