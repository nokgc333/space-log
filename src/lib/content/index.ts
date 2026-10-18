import { privacy as rawPrivacy } from "@content/privacy";
import { contact as rawContact } from "@content/sections/contact";
import { hero as rawHero } from "@content/sections/hero";
import { inversion as rawInversion } from "@content/sections/inversion";
import { news as rawNews } from "@content/sections/news";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { tools as rawTools } from "@content/sections/tools";
import { site as rawSite } from "@content/site";

import {
  contactContentSchema,
  heroSchema,
  inversionSchema,
  newsSchema,
  pipelineSchema,
  privacySchema,
  siteSchema,
  toolsSchema,
} from "./schema";

export const site = siteSchema.parse(rawSite);
export const hero = heroSchema.parse(rawHero);
export const inversion = inversionSchema.parse(rawInversion);
export const news = newsSchema.parse(rawNews);
export const pipeline = pipelineSchema.parse(rawPipeline);
export const tools = toolsSchema.parse(rawTools);
export const contact = contactContentSchema.parse(rawContact);
export const privacy = privacySchema.parse(rawPrivacy);

export type * from "./schema";
