// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
// @ts-ignore - Deno URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// @ts-ignore - Deno global
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore - Deno global
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const userId = body?.userId;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete all user data tables
    const userIdTables = [
      "better_self_conversations",
      "goal_setup_sessions",
      "daily_goal_logs",
      "generated_goals",
      "custom_goals",
      "accomplishment_logs",
      "aspiration_progress",
      "aspirations",
      "time_capsules",
      "fcm_tokens",
      "user_xp",
      "user_streak",
      "user_preferences",
    ];

    for (const table of userIdTables) {
      await supabase.from(table).delete().eq("user_id", userId);
    }

    // Delete users table row
    await supabase.from("users").delete().eq("id", userId);

    // Delete auth user
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);

    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
