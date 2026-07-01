import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { z } from "zod";

import type { ScrapedMetadata } from "@/lib/types";
import { absoluteUrl, normalizeUrl } from "@/lib/utils";

const requestSchema = z.object({
  url: z.string().url()
});

const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function isPrivateAddress(address: string) {
  const family = isIP(address);

  if (family === 4) {
    return isPrivateIpv4(address);
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }

  return true;
}

async function assertPublicUrl(input: string) {
  const parsed = new URL(input);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (PRIVATE_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Private or local URLs are not allowed.");
  }

  const addresses = await lookup(parsed.hostname, { all: true, verbatim: true });

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("Private network targets are not allowed.");
  }

  return parsed;
}

function readMeta(html: string, selectors: string[]) {
  for (const selector of selectors) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const metaPattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i"
    );
    const match = html.match(metaPattern);
    const value = match?.[1] ?? match?.[2];

    if (value) return decodeHtml(value.trim());
  }

  return undefined;
}

function readTitle(html: string) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1].trim()) : undefined;
}

function readLink(html: string, rels: string[]) {
  for (const rel of rels) {
    const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `<link[^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]*>`,
      "i"
    );
    const match = html.match(pattern);
    const value = match?.[1] ?? match?.[2];

    if (value) return decodeHtml(value.trim());
  }

  return undefined;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function scrapeMetadata(body: unknown): Promise<ScrapedMetadata> {
  const parsed = requestSchema.parse(body);
  const publicUrl = await assertPublicUrl(parsed.url);
  const normalizedUrl = normalizeUrl(publicUrl.toString());

  const response = await fetch(publicUrl, {
    redirect: "follow",
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "ResearchBoardBot/0.1 (+metadata preview)"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Metadata request failed with ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error("The URL did not return an HTML page.");
  }

  const html = (await response.text()).slice(0, 400_000);
  const finalUrl = response.url || normalizedUrl;
  const title =
    readMeta(html, ["og:title", "twitter:title"]) ??
    readTitle(html) ??
    new URL(finalUrl).hostname;
  const description =
    readMeta(html, ["og:description", "twitter:description", "description"]) ??
    "No description was found for this page.";
  const siteName = readMeta(html, ["og:site_name"]) ?? new URL(finalUrl).hostname;
  const imageUrl = absoluteUrl(
    readMeta(html, ["og:image", "twitter:image"]),
    finalUrl
  );
  const faviconUrl = absoluteUrl(
    readLink(html, ["icon", "shortcut icon", "apple-touch-icon"]),
    finalUrl
  );

  return {
    url: finalUrl,
    normalizedUrl: normalizeUrl(finalUrl),
    title,
    description,
    faviconUrl,
    imageUrl,
    siteName
  };
}
