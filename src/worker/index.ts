import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use("*", cors());

// Default endpoint
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Secure password generation endpoint
app.post("/api/generate", async (c) => {
  const { pepper, word } = await c.req.json<{ pepper: string; word: string }>();

  if (!pepper || !word) {
    return c.json({ error: "Both 'pepper' and 'word' are required." }, 400);
  }

  const result = await generateSecurePassword(word, pepper);
  return c.json(result);
});

// Maintain backwards compatibility
app.get("/api/generate/:pepper/:word", async (c) => {
  const { pepper, word } = c.req.param();
  
  if (!pepper || !word) {
    return c.json({ error: "Both pepper and word are required" }, 400);
  }

  const result = await generateSecurePassword(word, pepper);
  return c.json({ password: result.password });
});

async function generateSecurePassword(word: string, pepper: string) {
  const encoder = new TextEncoder();
  const input = encoder.encode(word + pepper);

  // Use static salt for deterministic password generation
  const salt = encoder.encode("static-salt-for-deterministic-results");
  const key = await crypto.subtle.importKey("raw", input, "PBKDF2", false, ["deriveBits"]);

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

  // Format the password to be more user-friendly
  const formattedPassword = formatPassword(bits);
  
  // Encode hash to base64
  const hashBase64 = bufferToBase64(bits);
  const saltBase64 = bufferToBase64(salt.buffer);

  return {
    password: formattedPassword,
    rawHash: hashBase64,
    salt: saltBase64,
    iterations: 100_000,
    hash: "SHA-256",
  };
}

function formatPassword(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.slice(0, 16).replace(/\+/g, "@").replace(/\//g, "#");
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

export default app;
