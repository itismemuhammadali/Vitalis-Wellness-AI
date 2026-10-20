import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, photoUrl } = await req.json();

    if (!userId || !photoUrl) {
      return new Response(
        JSON.stringify({
          error: "Invalid input: userId and photoUrl required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("🎨 Starting Better Self Avatar generation...");

    const { createClient } =
      await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Storage configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Fetch user aspirations
    console.log("📋 Fetching user aspirations...");
    const { data: aspirationsData, error: aspirationsError } = await supabase
      .from("aspirations")
      .select("description")
      .eq("user_id", userId);

    if (aspirationsError || !aspirationsData || aspirationsData.length === 0) {
      console.error("❌ No aspirations found:", aspirationsError);
      return new Response(
        JSON.stringify({
          error: "No aspirations found. Please set your aspirations first.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aspirations = aspirationsData.map((a: any) => a.description);
    console.log("🎯 Aspirations:", aspirations);

    // Step 2: Use GPT-4o Vision to analyze the photo
    console.log("👁️ Analyzing photo with GPT-4o Vision...");

    const visionResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this photo and describe in detail:
1. POSTURE: Exact body position (standing, sitting, angle, how arms are positioned, head tilt, etc.)
2. CLOTHING: What the person is wearing (colors, style, type of clothes)
3. BACKGROUND: What is behind them (indoor/outdoor, colors, setting)
4. LIGHTING: Direction and quality of light
5. CAMERA ANGLE: Where the camera is relative to the person (eye level, slightly above, etc.)
6. FRAMING: How much of the body is visible (full body, waist up, face only, etc.)

Be very specific and detailed. This description will be used to preserve these exact elements in a transformed image.`,
                },
                {
                  type: "image_url",
                  image_url: { url: photoUrl, detail: "high" },
                },
              ],
            },
          ],
          max_tokens: 600,
        }),
      },
    );

    let photoAnalysis = "";
    if (visionResponse.ok) {
      const visionData = await visionResponse.json();
      photoAnalysis = visionData.choices?.[0]?.message?.content || "";
      console.log("✅ Photo analysis complete");
      console.log(photoAnalysis);
    } else {
      console.warn("⚠️ Vision analysis failed, continuing without it");
    }

    // Step 3: Build smart visual enhancements based on aspirations
    const aspirationText = aspirations.join(" ").toLowerCase();
    const visualEnhancements: string[] = [];

    // MUSCULAR / STRENGTH / GYM
    if (
      aspirationText.includes("muscular") ||
      aspirationText.includes("muscle") ||
      aspirationText.includes("bulk") ||
      aspirationText.includes("strong") ||
      aspirationText.includes("strength") ||
      aspirationText.includes("bodybuilding") ||
      aspirationText.includes("gym")
    ) {
      visualEnhancements.push(
        "Show the person shirtless or in a sleeveless athletic tank top to clearly display their muscular physique, defined chest, broad shoulders, and visible muscle definition. The body should look athletic and powerful.",
      );
    }

    // WEIGHT GAIN / BULK UP / HEAVIER
    // Check for weight gain FIRST before weight loss
    const weightGainMatch = aspirationText.match(/(\d+)\s*(pounds|lbs|kg|kilograms)/i);
    const hasWeightGainKeywords = 
      aspirationText.includes("gain weight") ||
      aspirationText.includes("bulk up") ||
      aspirationText.includes("get bigger") ||
      aspirationText.includes("heavier") ||
      aspirationText.includes("put on weight") ||
      aspirationText.includes("add weight");
    
    if (weightGainMatch || hasWeightGainKeywords) {
      const targetWeight = weightGainMatch ? parseInt(weightGainMatch[1]) : null;
      
      if (targetWeight && targetWeight >= 250) {
        // Significant weight gain (250+ pounds)
        visualEnhancements.push(
          `Show the person with a significantly larger, heavier physique at approximately ${targetWeight} pounds. Much fuller face, broader body, larger arms and torso, substantial body mass. The person should look noticeably heavier and bigger overall, with a fuller figure and increased body size throughout.`,
        );
      } else if (targetWeight && targetWeight >= 180) {
        // Moderate weight gain (180-249 pounds)
        visualEnhancements.push(
          `Show the person with a larger, heavier build at approximately ${targetWeight} pounds. Fuller face, broader shoulders, larger arms, more substantial body mass. The person should look bigger and heavier with increased muscle and body mass.`,
        );
      } else {
        // General weight gain
        visualEnhancements.push(
          "Show the person with a larger, heavier physique. Fuller face, broader body, larger arms and torso, increased body mass. The person should look noticeably bigger and heavier overall.",
        );
      }
    }
    // WEIGHT LOSS / FAT LOSS / LEAN
    else if (
      aspirationText.includes("lose") ||
      aspirationText.includes("loss") ||
      aspirationText.includes("fat") ||
      aspirationText.includes("slim") ||
      aspirationText.includes("lean") ||
      aspirationText.includes("thin") ||
      aspirationText.includes("belly")
    ) {
      visualEnhancements.push(
        "Show the person with a noticeably leaner, slimmer physique. Flat stomach, no belly fat, fitted clothing that shows a toned body shape. Healthy and energetic appearance.",
      );
    }

    // FLEXIBILITY / YOGA / AGILITY
    if (
      aspirationText.includes("flexible") ||
      aspirationText.includes("flexibility") ||
      aspirationText.includes("yoga") ||
      aspirationText.includes("agile") ||
      aspirationText.includes("stretch")
    ) {
      visualEnhancements.push(
        "Show the person in athletic, flexible clothing like yoga pants or athletic wear. Their posture should convey ease of movement and physical agility.",
      );
    }

    // HEALTH / WELLNESS / ENERGY / FITNESS
    if (
      aspirationText.includes("health") ||
      aspirationText.includes("healthy") ||
      aspirationText.includes("wellness") ||
      aspirationText.includes("energy") ||
      aspirationText.includes("vitality") ||
      aspirationText.includes("fit")
    ) {
      visualEnhancements.push(
        "Show the person with a glowing, healthy complexion, bright eyes, and vibrant energy. They should look well-rested, full of life, and radiantly healthy.",
      );
    }

    // WEALTH / FINANCIAL SUCCESS / MONEY
    if (
      aspirationText.includes("money") ||
      aspirationText.includes("wealth") ||
      aspirationText.includes("rich") ||
      aspirationText.includes("financial") ||
      aspirationText.includes("income") ||
      aspirationText.includes("millionaire") ||
      aspirationText.includes("100k") ||
      aspirationText.includes("earn") ||
      aspirationText.includes("dollar") ||
      aspirationText.includes("invest")
    ) {
      visualEnhancements.push(
        "Show the person dressed in a sharp, expensive-looking tailored suit or premium business attire. Add subtle luxury accessories like a quality watch. The background should suggest a high-end office or upscale environment. They should exude confidence and financial success.",
      );
    }

    // CAREER / PROFESSIONAL / BUSINESS / ENTREPRENEUR
    if (
      aspirationText.includes("career") ||
      aspirationText.includes("professional") ||
      aspirationText.includes("business") ||
      aspirationText.includes("entrepreneur") ||
      aspirationText.includes("ceo") ||
      aspirationText.includes("leader") ||
      aspirationText.includes("promotion") ||
      aspirationText.includes("startup")
    ) {
      visualEnhancements.push(
        "Show the person in polished professional attire - a well-fitted blazer or business suit. Their posture should be upright and commanding. The setting should feel corporate and successful.",
      );
    }

    // CONFIDENCE / SELF-ESTEEM / MINDSET / HAPPINESS
    if (
      aspirationText.includes("confident") ||
      aspirationText.includes("confidence") ||
      aspirationText.includes("self-esteem") ||
      aspirationText.includes("mindset") ||
      aspirationText.includes("happy") ||
      aspirationText.includes("positive") ||
      aspirationText.includes("mental")
    ) {
      visualEnhancements.push(
        "Show the person with a strong, confident posture - head held high, relaxed smile, open body language. Their expression should radiate self-assurance and inner peace.",
      );
    }

    // SOCIAL / RELATIONSHIPS / CHARISMA / ATTRACTIVE
    if (
      aspirationText.includes("social") ||
      aspirationText.includes("charisma") ||
      aspirationText.includes("relationship") ||
      aspirationText.includes("attractive") ||
      aspirationText.includes("dating") ||
      aspirationText.includes("charm") ||
      aspirationText.includes("personality")
    ) {
      visualEnhancements.push(
        "Show the person with a warm, magnetic smile and approachable, charismatic energy. Well-groomed, stylishly dressed in smart casual attire that makes them look attractive and socially confident.",
      );
    }

    // TRAVEL / ADVENTURE / LIFESTYLE / FREEDOM
    if (
      aspirationText.includes("travel") ||
      aspirationText.includes("adventure") ||
      aspirationText.includes("lifestyle") ||
      aspirationText.includes("freedom") ||
      aspirationText.includes("explore") ||
      aspirationText.includes("world")
    ) {
      visualEnhancements.push(
        "Show the person in stylish travel-ready casual wear. The background can hint at an exotic or beautiful location. Their expression should convey freedom, excitement, and a sense of adventure.",
      );
    }

    // EDUCATION / KNOWLEDGE / SKILLS / LEARNING
    if (
      aspirationText.includes("education") ||
      aspirationText.includes("degree") ||
      aspirationText.includes("knowledge") ||
      aspirationText.includes("skill") ||
      aspirationText.includes("learn") ||
      aspirationText.includes("study") ||
      aspirationText.includes("graduate")
    ) {
      visualEnhancements.push(
        "Show the person in smart, intellectual attire - perhaps a neat blazer or academic-style clothing. Their expression should convey intelligence, curiosity, and accomplishment.",
      );
    }

    const enhancementsText =
      visualEnhancements.length > 0
        ? `\nSPECIFIC VISUAL ENHANCEMENTS REQUIRED:\n${visualEnhancements.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
        : "";

    console.log("🎨 Visual enhancements detected:", visualEnhancements.length);
    if (visualEnhancements.length > 0) {
      visualEnhancements.forEach((e, i) =>
        console.log(`  ${i + 1}. ${e.substring(0, 80)}...`),
      );
    }

    // Step 4: Generate transformation prompt
    console.log("🧠 Generating transformation prompt...");

    const promptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `You are an expert image transformation specialist for a personal development app called Kyvo.

ABOUT KYVO:
Kyvo helps users achieve their aspirations by creating a "Better Self Avatar" - a visual representation of who they want to become. This avatar serves as their daily guide and motivation.

USER'S ASPIRATIONS:
${aspirations.join(". ")}

CURRENT PHOTO ANALYSIS:
${photoAnalysis || "No analysis available"}
${enhancementsText}

YOUR TASK:
Create a detailed image transformation prompt that will transform the user's photo to show them as their best self having achieved these goals.

CRITICAL REQUIREMENTS:
1. PRESERVE EXACTLY: The posture, body position, camera angle, and framing described in the photo analysis
2. PRESERVE: Face features, facial structure, and overall identity - the person must be recognizable
3. APPLY ALL: Every specific visual enhancement listed above - these are MANDATORY and must be applied exactly as described
4. BE EXPLICIT: For body transformations (weight gain, weight loss, muscle gain), be very specific about the physical changes - describe body size, proportions, and appearance in detail
5. FOCUS: On realistic, achievable transformations that clearly show the aspiration has been achieved

IMPORTANT: If the enhancements mention a specific weight (like "400 pounds"), make sure the transformation shows a body that realistically looks like that weight. Be explicit about body size, fullness, and proportions.

Return ONLY the transformation prompt text, nothing else.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 700,
        }),
      },
    );

    if (!promptResponse.ok) {
      const err = await promptResponse.json();
      console.error("❌ Prompt generation failed:", err);
      return new Response(
        JSON.stringify({
          error: "Failed to generate transformation prompt",
          details: err,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const promptData = await promptResponse.json();
    const transformationPrompt = promptData.choices?.[0]?.message?.content;

    if (!transformationPrompt) {
      return new Response(
        JSON.stringify({ error: "Empty transformation prompt" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ Transformation prompt:");
    console.log(transformationPrompt);

    // Step 5: Download the original image
    console.log("📥 Downloading original image...");
    const imageResponse = await fetch(photoUrl);
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to download original image" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const imageBlob = await imageResponse.blob();
    const imageArrayBuffer = await imageBlob.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageArrayBuffer);
    console.log("✅ Image downloaded, size:", imageUint8Array.length, "bytes");

    // Step 6: Call GPT Image 1.5 using multipart/form-data
    console.log("🔄 Calling GPT Image 1.5 API...");

    const formData = new FormData();
    formData.append("model", "gpt-image-1.5");
    formData.append("prompt", transformationPrompt);
    formData.append("input_fidelity", "high");
    formData.append(
      "image",
      new Blob([imageUint8Array], { type: "image/jpeg" }),
      "photo.jpg",
    );

    const editResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    console.log("📊 GPT Image response status:", editResponse.status);

    if (!editResponse.ok) {
      const errorData = await editResponse.json();
      console.error("❌ GPT Image error:", JSON.stringify(errorData));
      return new Response(
        JSON.stringify({
          error: "Image transformation failed",
          details: errorData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const editData = await editResponse.json();
    const imageItem = editData.data?.[0];
    let transformedBytes: Uint8Array;

    if (imageItem?.b64_json) {
      console.log("📦 Decoding base64 image...");
      const binaryString = atob(imageItem.b64_json);
      transformedBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        transformedBytes[i] = binaryString.charCodeAt(i);
      }
      console.log("✅ Decoded, size:", transformedBytes.length, "bytes");
    } else if (imageItem?.url) {
      console.log("📥 Downloading from URL...");
      const dlResponse = await fetch(imageItem.url);
      const dlBuffer = await dlResponse.arrayBuffer();
      transformedBytes = new Uint8Array(dlBuffer);
      console.log("✅ Downloaded, size:", transformedBytes.length, "bytes");
    } else {
      console.error("❌ Unexpected response:", JSON.stringify(editData));
      return new Response(
        JSON.stringify({
          error: "No image data in response",
          details: editData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 7: Upload to Supabase storage (avatars bucket)
    console.log("📤 Uploading to Supabase storage...");

    const fileName = `better-self-${userId}-${Date.now()}.png`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, transformedBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({
          error: "Failed to upload to storage",
          details: uploadError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log("✅ Better self avatar stored at:", publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        transformationPrompt: transformationPrompt,
        enhancementsApplied: visualEnhancements.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Function error:", errorMsg);
    return new Response(
      JSON.stringify({ error: "Internal error", details: errorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
