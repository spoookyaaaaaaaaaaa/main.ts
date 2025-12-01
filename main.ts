import {
  InteractionResponseType,
  InteractionType,
  verifySignature,
} from "https://deno.land/x/discord_interactions@0.1.1/mod.ts";

// Environment variable names expected in Deno Deploy settings:
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN"); // used only by register.ts
const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY"); // required here
const ALLOWED_ROLE_ID = Deno.env.get("ALLOWED_ROLE_ID") ?? ""; // optional, can be empty

if (!DISCORD_PUBLIC_KEY) {
  console.error("Missing DISCORD_PUBLIC_KEY env var. Set in Deno Deploy settings.");
}

// Helper: ephemeral reply
function ephemeralReply(content: string) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64 },
  };
}

Deno.serve(async (req: Request) => {
  try {
    const signature = req.headers.get("x-signature-ed25519") ?? "";
    const timestamp = req.headers.get("x-signature-timestamp") ?? "";
    const body = await req.text();

    // verify request signature
    const valid = verifySignature({
      body,
      signature,
      timestamp,
      publicKey: DISCORD_PUBLIC_KEY!,
    });
    if (!valid) {
      return new Response("Invalid request signature", { status: 401 });
    }

    const json = JSON.parse(body);

    // PING (Discord initial handshake)
    if (json.type === InteractionType.PING) {
      return Response.json({ type: InteractionResponseType.PONG });
    }

    // Application command
    if (json.type === InteractionType.APPLICATION_COMMAND) {
      const commandName: string = json.data.name;
      // If you use role restriction: member available in guild commands
      const memberRoles: string[] = json.member?.roles ?? [];

      // Optional: require ALLOWED_ROLE_ID (if set)
      if (ALLOWED_ROLE_ID && !memberRoles.includes(ALLOWED_ROLE_ID)) {
        return Response.json(ephemeralReply("❌ You do not have permission to use this command."));
      }

      // Handle /embed (the example)
      if (commandName === "embed") {
        const userText = (json.data.options?.find((o: any) => o.name === "text")?.value) ?? "No text provided.";
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

      // Handle /autoformat (simple example)
      if (commandName === "autoformat") {
        const title = (json.data.options?.find((o: any) => o.name === "title")?.value) ?? "Rule";
        const explanation = (json.data.options?.find((o: any) => o.name === "explanation")?.value) ?? "";
        const punishment = (json.data.options?.find((o: any) => o.name === "punishment")?.value) ?? "";
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
  } catch (err) {
    console.error("main.ts error:", err);
    return new Response("Server error", { status: 500 });
  }
});
