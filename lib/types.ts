export type Score = "yes" | "maybe" | "no" | null;

export const DIMENSIONS = [
  { key: "estilo", label: "Estilo visual" },
  { key: "vibe", label: "Vibe / mood" },
  { key: "tipografia", label: "Tipografia" },
  { key: "composicao", label: "Composição / layout" },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export type Moodboard = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type MoodboardReference = {
  id: string;
  moodboard_id: string;
  image_url: string;
  storage_path: string | null;
  title: string | null;
  position: number;
  created_at: string;
};

export type MoodboardResponse = {
  id: string;
  moodboard_id: string;
  client_name: string | null;
  general_comment: string | null;
  submitted_at: string;
};

export type MoodboardResponseItem = {
  id: string;
  response_id: string;
  reference_id: string;
  estilo: Score;
  cores: Score;
  vibe: Score;
  tipografia: Score;
  composicao: Score;
  mensagem: Score;
  why: string | null;
};
