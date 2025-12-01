// ===== Discord Bot (Deno Deploy) =====

// Import Discord library (Deno-compatible)
import {
  InteractionResponseType,
  InteractionType,
  verifySignature,
} from "https://deno.land/x/discord_interactions@1.0.0/mod.ts";

// Environment variables
const TOKEN = Deno.env.get("DISCORD_TOKEN");
const PUBLIC_KEY = Deno.env.get("PUBLIC_KEY");
const APP_ID = Deno.env.get("APPLICATION_ID");

// Required: respond to Discord pings
async function handleInteraction(request: Request): Promise<Response> {
  const signature = request.headers.get("x-signature-ed25519")!;
  const timestamp = request.headers.get("x-signature-timestamp")!;
  const body = await request.text();

  const isValid = verifySignature({
    body,
    signature,
    timestamp,
    publicKey: PUBLIC_KEY!,
  });

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const json = JSON.parse(body);

  // Ping request for verification
  if (json.type === InteractionType.PING) {
    return Response.json({ type: InteractionResponseType.PONG });
  }

  // Slash command handler
  if (json.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = json.data;

    // /embed
    if (name === "embed") {
      const userText = options?.find((o: any) => o.name === "text")?.value;

      return Response.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: "📌 Custom Embed",
              description: userText || "No text provided.",
              color: 0x00aaff,
            },
          ],
        },
      });
    }
  }

  return new Response("OK");
}

// HTTP server for Discord interactions
Deno.serve(async (req: Request) => {
  if (req.method === "POST") {
    return handleInteraction(req);
  }

  return new Response("Bot is running 👍");
});
