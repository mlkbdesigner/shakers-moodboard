import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditForm } from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditMoodboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mb } = await supabase
    .from("moodboards")
    .select("*")
    .eq("id", id)
    .single();
  if (!mb) notFound();

  const { data: refs } = await supabase
    .from("moodboard_references")
    .select("*")
    .eq("moodboard_id", id)
    .order("position");

  return <EditForm moodboard={mb} initialRefs={refs ?? []} />;
}
