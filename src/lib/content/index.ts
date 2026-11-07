import { site as rawSite } from "@content/site";
import { hero as rawHero } from "@content/sections/hero";
import { inversion as rawInversion } from "@content/sections/inversion";
import { news as rawNews } from "@content/sections/news";

import { siteSchema, heroSchema, inversionSchema, newsSchema } from "./schema";

export const site = siteSchema.parse(rawSite);
export const hero = heroSchema.parse(rawHero);
export const inversion = inversionSchema.parse(rawInversion);
export const news = newsSchema.parse(rawNews);

export type * from "./schema";
