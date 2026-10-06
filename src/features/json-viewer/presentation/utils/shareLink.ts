// El JSON se comprime y viaja en el #hash de la URL: el hash nunca se envía al servidor.

async function pipe(bytes: Uint8Array<ArrayBuffer>, transform: CompressionStream | DecompressionStream) {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export async function encodeShareHash(text: string): Promise<string> {
  return toBase64Url(await pipe(new TextEncoder().encode(text), new CompressionStream("deflate")));
}

export async function decodeShareHash(hash: string): Promise<string> {
  return new TextDecoder().decode(await pipe(fromBase64Url(hash), new DecompressionStream("deflate")));
}

export function buildShareUrl(hash: string): string {
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}
