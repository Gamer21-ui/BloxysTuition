import "server-only";

type Embed = { title?: string; description?: string; color?: number; url?: string; footer?: { text: string } };

/** Post to the Discord channel webhook. Fails silently: Discord being down must never break the app. */
export async function postToDiscord(content: string, embeds: Embed[] = [], channel: "feed" | "announce" = "feed") {
  const url =
    channel === "announce"
      ? process.env.DISCORD_ANNOUNCE_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL
      : process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds, allowed_mentions: { parse: [] } }),
    });
  } catch {
    /* ignore */
  }
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
