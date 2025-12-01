const TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID");
const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");

const commands = [
  {
    name: "embed",
    description: "Send a test embed",
  },
];

await fetch(
  `https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${TOKEN}`,
    },
    body: JSON.stringify(commands),
  },
);

console.log("Slash commands registered!");
