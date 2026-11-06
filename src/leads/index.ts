import type { Lead } from "@/lib/types";
import zazos from "./zazos";
// @leads:import

const all: Lead[] = [
  zazos,
  // @leads:register
];

const bySlug = new Map(all.map((l) => [l.slug, l]));

export const leadSlugs = () => all.map((l) => l.slug);
export const getLead = (slug: string) => bySlug.get(slug);
