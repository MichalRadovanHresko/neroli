import { createClient } from "npm:@supabase/supabase-js@2";

// Generate a perfume recipe from a user’s selected scents and idea.

// Allow the browser app to call this function and send its auth token.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Return consistent JSON responses with the required CORS headers.
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Keep model-generated profile values within the expected 0–100 range.
const clamp = (value) =>
  Math.min(100, Math.max(0, Math.round(Number(value) || 50)));

// Handle browser preflight, authenticate the user, and build the recipe.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  // Forward the caller’s token so Supabase can identify the signed-in user.
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

  // Read user choices and reject requests with too many selected scents.
  const { scentIds = [], idea = "" } = await req.json();
  if (!Array.isArray(scentIds) || scentIds.length > 12) {
    return json({ error: "Select at most 12 scents" }, 400);
  }

  // Load the scent catalogue and stop when it cannot supply recipe options.
  const { data: allScents, error } = await supabase
    .from("scents")
    .select("id, name, scent_family, note_type, intensity, short_description");
  if (error || !allScents?.length)
    return json({ error: "Scents not found" }, 400);

  // Use requested scents when supplied, otherwise offer a random selection.
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

  // Set the authentication and content headers required by Anthropic.
  const headers = {
    "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };

  // Use a configured model or discover one available to this API key.
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

  // Ask the model for a structured recipe constrained to the available scents.
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
      // Restrict the model output to fields the app can save and display.
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

  // Convert API failures and missing tool output into clear function errors.
  if (!res.ok) {
    const detail = await res.text();
    console.error("Anthropic error", res.status, detail);
    return json({ error: `Anthropic ${res.status}: ${detail}` }, 502);
  }
  const data = await res.json();
  const input = data.content?.find((b) => b.type === "tool_use")?.input;
  if (!input) return json({ error: "No recipe returned" }, 502);

  // Keep only valid scent ids and normalize all returned recipe fields.
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
