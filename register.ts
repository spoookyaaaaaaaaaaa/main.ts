const TOKEN = Deno.env.get("DISCORD_TOKEN");
const APP_ID = Deno.env.get("APPLICATION_ID");

await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${TOKEN}`,
  },
  body: JSON.stringify({
    name: "embed",
    description: "Create a custom embed",
    options: [
      {
        name: "text",
        description: "Text inside embed",
        type: 3,
        required: true,
      },
    ],
  }),
});

console.log("Slash command registered!");
