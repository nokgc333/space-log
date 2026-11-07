import { site as rawSite } from "@content/site";
import { hero as rawHero } from "@content/sections/hero";
import { inversion as rawInversion } from "@content/sections/inversion";
import { news as rawNews } from "@content/sections/news";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { tools as rawTools } from "@content/sections/tools";

import {
  siteSchema,
  heroSchema,
  inversionSchema,
  newsSchema,
  pipelineSchema,
  toolsSchema,
} from "./schema";

export const site = siteSchema.parse(rawSite);
export const hero = heroSchema.parse(rawHero);
export const inversion = inversionSchema.parse(rawInversion);
export const news = newsSchema.parse(rawNews);
export const pipeline = pipelineSchema.parse(rawPipeline);
export const tools = toolsSchema.parse(rawTools);

export type * from "./schema";
