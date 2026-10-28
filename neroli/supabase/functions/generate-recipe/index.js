import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clamp = (value) =>
  Math.min(100, Math.max(0, Math.round(Number(value) || 50)));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { scentIds = [], idea = "" } = await req.json();
  if (!Array.isArray(scentIds) || scentIds.length > 12) {
    return json({ error: "Select at most 12 scents" }, 400);
  }

  const { data: allScents, error } = await supabase
    .from("scents")
    .select("id, name, scent_family, note_type, intensity, short_description");
  if (error || !allScents?.length)
    return json({ error: "Scents not found" }, 400);

  const chosen = allScents.filter((scent) => scentIds.includes(scent.id));
  const shuffled = [...allScents].sort(() => Math.random() - 0.5);
  const pool = chosen.length > 0 ? chosen : shuffled.slice(0, 14);
  const moods = [
    "fresh and airy",
    "warm and cozy",
    "dark and mysterious",
    "sweet and gourmand",
    "floral and romantic",
    "woody and earthy",
    "bold and unconventional",
    "clean and minimal",
  ];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  const validIds = new Set(pool.map((scent) => scent.id));

  const headers = {
    "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };

  let model = Deno.env.get("ANTHROPIC_MODEL");
  if (!model) {
    const list = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers,
    });
    if (!list.ok)
      return json(
        { error: `Anthropic ${list.status}: ${await list.text()}` },
        502,
      );
    const ids = (await list.json()).data?.map((m) => m.id) ?? [];
    model =
      ids.find((id) => id.includes("haiku")) ??
      ids.find((id) => id.includes("sonnet")) ??
      ids[0];
    if (!model)
      return json({ error: "No models available for this API key" }, 502);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system:
        "You are a perfumer. Create a custom perfume recipe using only the scents provided. " +
        (chosen.length > 0
          ? "Use all of the provided scents."
          : "Pick 3 to 4 scents that blend well, balancing top, middle and base notes.") +
        " Reply only by calling the create_recipe tool. Be concise.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            idea: String(idea).slice(0, 300) || `a ${mood} perfume`,
            scents: pool,
          }),
        },
      ],
      tools: [
        {
          name: "create_recipe",
          description: "Returns the finished perfume recipe.",
          input_schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Short recipe name" },
              subtitle: {
                type: "string",
                description: "A few words, e.g. 'Warm & Sweet'",
              },
              description: {
                type: "string",
                description: "1-2 sentences about the character of the blend",
              },
              scent_ids: {
                type: "array",
                items: { type: "string" },
                description:
                  "ids of the scents used, taken only from the provided list",
              },
              profile: {
                type: "object",
                properties: {
                  sweet: { type: "number" },
                  warm: { type: "number" },
                  fresh: { type: "number" },
                  intensity: { type: "number" },
                },
                required: ["sweet", "warm", "fresh", "intensity"],
                description: "Each value 0-100",
              },
              steps: {
                type: "array",
                items: { type: "string" },
                description: "3 to 5 short blending and maceration steps",
              },
            },
            required: [
              "name",
              "subtitle",
              "description",
              "scent_ids",
              "profile",
              "steps",
            ],
          },
        },
      ],
      tool_choice: { type: "tool", name: "create_recipe" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Anthropic error", res.status, detail);
    return json({ error: `Anthropic ${res.status}: ${detail}` }, 502);
  }
  const data = await res.json();
  const input = data.content?.find((b) => b.type === "tool_use")?.input;
  if (!input) return json({ error: "No recipe returned" }, 502);

  const ids = (input.scent_ids ?? []).filter((id) => validIds.has(id));
  return json({
    recipe: {
      name: String(input.name ?? "").slice(0, 80),
      subtitle: String(input.subtitle ?? "").slice(0, 80),
      description: String(input.description ?? "").slice(0, 600),
      scentIds:
        ids.length > 0 ? ids : pool.slice(0, 5).map((scent) => scent.id),
      profile: {
        sweet: clamp(input.profile?.sweet),
        warm: clamp(input.profile?.warm),
        fresh: clamp(input.profile?.fresh),
        intensity: clamp(input.profile?.intensity),
      },
      steps: (input.steps ?? []).slice(0, 6).map((step) => String(step)),
    },
  });
});
