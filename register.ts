// register.ts — registers guild slash commands
// This file should be run once (locally with deno run --allow-net --allow-env register.ts)
// or via deploy_register.ts on Deno Deploy.

const TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID"); // application id
const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");   // your test server id

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing one of DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID environment variables.");
  Deno.exit(1);
}

const commands = [
  {
    name: "embed",
    description: "Create a custom embed",
    options: [
      { name: "text", description: "Text inside the embed", type: 3, required: true },
    ],
  },
  {
    name: "autoformat",
    description: "Auto format a rule (Style A)",
    options: [
      { name: "title", type: 3, required: true, description: "Rule title" },
      { name: "explanation", type: 3, required: true, description: "Explanation" },
      { name: "punishment", type: 3, required: true, description: "Consequences/punishment" },
    ],
  },
];

const res = await fetch(`https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${TOKEN}`,
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error("Failed to register commands:", res.status, await res.text());
  Deno.exit(1);
}

console.log("Slash commands registered (guild).");
