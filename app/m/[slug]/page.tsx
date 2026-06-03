import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "./ClientForm";

export const dynamic = "force-dynamic";

export default async function ClientMoodboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: mb } = await supabase
    .from("moodboards")
    .select("id, slug, name, client_name, notes")
    .eq("slug", slug)
    .single();
  if (!mb) notFound();

  const { data: refs } = await supabase
    .from("moodboard_references")
    .select("*")
    .eq("moodboard_id", mb.id)
    .order("position");

  return <ClientForm moodboard={mb} refs={refs ?? []} />;
}
