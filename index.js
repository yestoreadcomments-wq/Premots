require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { execSync, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const PREFIX = "*";
const PROM_REPO = "https://github.com/levno-710/Prometheus.git";
const PROM_DIR = path.join(__dirname, "prometheus");
const TEMP_DIR = path.join(__dirname, "temp");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function ensureFolders() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
}

function ensurePrometheus() {
  if (!fs.existsSync(PROM_DIR)) {
    console.log("📥 Prometheus not found, cloning...");
    execSync(`git clone ${PROM_REPO} prometheus`, { stdio: "inherit" });
  } else {
    console.log("✅ Prometheus already exists");
  }
}

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  ensureFolders();
  ensurePrometheus();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).split(" ");
  const command = args.shift();

  const inputFile = path.join(TEMP_DIR, "input.lua");
  const outputFile = path.join(TEMP_DIR, "output.lua");

  // ========= *r RAW LUA =========
  if (command === "r") {
    const code = args.join(" ");
    if (!code) return message.reply("❌ Provide Lua code.");

    fs.writeFileSync(inputFile, code);
    runObfuscation(message, inputFile, outputFile);
  }

  // ========= *f FILE =========
  if (command === "f") {
    const file = message.attachments.first();
    if (!file || !file.name.endsWith(".lua"))
      return message.reply("❌ Upload a .lua file.");

    const res = await fetch(file.url);
    const text = await res.text();

    fs.writeFileSync(inputFile, text);
    runObfuscation(message, inputFile, outputFile);
  }
});

function runObfuscation(message, input, output) {
  const cmd = `lua prometheus/cli.lua --preset Medium "${input}" --out "${output}"`;

  exec(cmd, (err) => {
    if (err) {
      console.error(err);
      return message.reply("❌ Obfuscation failed.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🔒 Obfuscation Done")
      .setDescription("Obfuscated with **Prometheus Lua Obfuscator**")
      .addFields(
        { name: "Preset", value: "Medium", inline: true },
        { name: "Engine", value: "Prometheus", inline: true },
        {
          name: "Protections",
          value:
            "• Control Flow Flattening\n" +
            "• String Encryption\n" +
            "• Anti-Tamper\n" +
            "• Variable Renaming",
          inline: false
        }
      )
      .setColor(0x8e44ad);

    const attachment = new AttachmentBuilder(output, {
      name: "obfuscated.lua"
    });

    message.reply({ embeds: [embed], files: [attachment] });
  });
}

client.login(process.env.DISCORD_TOKEN);
