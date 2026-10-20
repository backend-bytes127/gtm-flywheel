import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const CreateLeadSchema = z.object({
  linkedin_url: z.string().url(),
  icp_id: z.string().uuid().optional(),
  source_url: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const icp_id = searchParams.get("icp_id");
  const limit = Number(searchParams.get("limit") ?? "50");

  const supabase = getSupabase();
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (stage) query = query.eq("stage", stage);
  if (icp_id) query = query.eq("icp_id", icp_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      linkedin_url: parsed.data.linkedin_url,
      icp_id: parsed.data.icp_id ?? null,
      source_url: parsed.data.source_url ?? null,
      stage: "new",
      signals: [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}
