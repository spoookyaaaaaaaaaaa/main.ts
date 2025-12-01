import {
  InteractionResponseType,
  InteractionType,
  verifySignature,
} from "https://deno.land/x/discord_interactions@0.1.1/mod.ts";

// ENV VARS
const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");
const ALLOWED_ROLE_ID = Deno.env.get("ALLOWED_ROLE_ID") ?? "";

if (!DISCORD_PUBLIC_KEY) {
  console.error("❌ Missing DISCORD_PUBLIC_KEY in Deploy settings.");
  Deno.exit(1);
}

// Helper: get option value from interaction data
function getOptionValue(options: any[] | undefined, name: string, defaultValue = ""): string {
  return options?.find((o) => o.name === name)?.value ?? defaultValue;
}

// Helper: ephemeral reply
function ephemeralReply(content: string) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64 },
  };
}

// ---- SERVER ----
Deno.serve(async (req: Request) => {
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";
  const body = await req.text();

  // 🔐 REQUIRED: verify all Discord requests
  const isValid = verifySignature({
    body,
    signature,
    timestamp,
    publicKey: DISCORD_PUBLIC_KEY,
  });

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const json = JSON.parse(body);

  // ⚡ REQUIRED: Respond to Discord PING (verification)
  if (json.type === InteractionType.PING) {
    return Response.json({ type: InteractionResponseType.PONG });
  }

  // Slash commands
  if (json.type === InteractionType.APPLICATION_COMMAND) {
    const name = json.data.name;
    const memberRoles: string[] = json.member?.roles ?? [];

    // Optional: role restricting
    if (ALLOWED_ROLE_ID && !memberRoles.includes(ALLOWED_ROLE_ID)) {
      return Response.json(ephemeralReply("❌ You do not have permission."));
    }

    // /embed
    if (name === "embed") {
      const userText = getOptionValue(json.data.options, "text", "No text provided.");

      return Response.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: "📌 Custom Embed",
              description: userText,
              color: 0x00aaff,
            },
          ],
        },
      });
    }

    // /autoformat
    if (name === "autoformat") {
      const title = getOptionValue(json.data.options, "title", "Rule");
      const explanation = getOptionValue(json.data.options, "explanation");
      const punishment = getOptionValue(json.data.options, "punishment");

      const dotted = "........................................";
      const desc = `➜ **${title}**\n${dotted}\n↳ ${explanation}\n${dotted}\n↳ **Consequences:** ${punishment}`;

      return Response.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { embeds: [{ title, description: desc, color: 0xffcc00 }] },
      });
    }

    return Response.json(ephemeralReply("❌ Unknown command."));
  }

  return new Response("OK");
});
