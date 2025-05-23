import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend requests
app.use("*", cors());

// Keep the default API endpoint
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Password generation endpoint
app.get("/api/generate/:pepper/:word", async (c) => {
  const { pepper, word } = c.req.param();
  
  if (!pepper || !word) {
    return c.json({ error: "Both pepper and word are required" }, 400);
  }

  const password = await generatePassword(word, pepper);
  return c.json({ password });
});

// Direct implementation endpoint (matching the original code pattern)
app.get("/:pepper/:word", async (c) => {
  const { pepper, word } = c.req.param();
  
  if (!pepper || !word) {
    return c.text("Usage: /pepper/word", 400);
  }

  const password = await generatePassword(word, pepper);
  return c.text(password);
});

async function generatePassword(word: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder();
  const input = encoder.encode(word + pepper);

  const key = await crypto.subtle.importKey("raw", input, { name: "PBKDF2" }, false, ["deriveBits"]);
  const salt = encoder.encode("static-salt"); // can be adjusted for more variability
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256
  );

  return formatPassword(bits);
}

function formatPassword(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.slice(0, 16).replace(/\+/g, "@").replace(/\//g, "#");
}

export default app;
