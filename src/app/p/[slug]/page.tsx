import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLead, leadSlugs } from "@/leads";
import Experience from "@/components/Unboxing/Experience";
import MultiExperience from "@/components/Unboxing/MultiExperience";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => leadSlugs().map((slug) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lead = getLead((await params).slug);
  if (!lead) return {};
  return {
    title: lead.meta.title,
    description: lead.meta.description,
    robots: { index: false, follow: false },
    openGraph: { title: lead.copy.title, description: lead.meta.description, type: "website" },
  };
}

export default async function LeadPage({ params }: Props) {
  const lead = getLead((await params).slug);
  if (!lead) notFound();
  // `Page` é um componente (não serializável): fica no servidor e recebe só os dados.
  const { Page, ...data } = lead;
  const View = Page ?? (data.pieces?.length ? MultiExperience : Experience);
  return <View lead={data} />;
}
