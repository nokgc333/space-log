import { privacy as rawPrivacy } from "@content/privacy";
import { contact as rawContact } from "@content/sections/contact";
import { hero as rawHero } from "@content/sections/hero";
import { inversion as rawInversion } from "@content/sections/inversion";
import { jobLog as rawJobLog } from "@content/sections/job-log";
import { news as rawNews } from "@content/sections/news";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { site as rawSite } from "@content/site";

import {
  contactContentSchema,
  heroSchema,
  inversionSchema,
  jobLogSchema,
  newsSchema,
  pipelineSchema,
  privacySchema,
  siteSchema,
} from "./schema";

export const site = siteSchema.parse(rawSite);
export const hero = heroSchema.parse(rawHero);
export const inversion = inversionSchema.parse(rawInversion);
export const news = newsSchema.parse(rawNews);
export const pipeline = pipelineSchema.parse(rawPipeline);
export const jobLog = jobLogSchema.parse(rawJobLog);
export const contact = contactContentSchema.parse(rawContact);
export const privacy = privacySchema.parse(rawPrivacy);

export type * from "./schema";
