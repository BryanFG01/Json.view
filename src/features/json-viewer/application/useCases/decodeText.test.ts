import { describe, expect, it } from "vitest";
import { decodeTextUseCase } from "./decodeText";

const TEXT = "INSERT [dbo].[clientes] ([nombre]) VALUES (N'Ñandú Pérez')\nGO\n";
const bytes = (...parts: (number[] | Uint8Array)[]) => new Uint8Array(parts.flatMap((p) => [...p]));
const utf16le = (s: string) => new Uint8Array(Buffer.from(s, "utf16le"));
const utf16be = (s: string) => {
  const le = utf16le(s);
  for (let i = 0; i < le.length; i += 2) [le[i], le[i + 1]] = [le[i + 1], le[i]];
  return le;
};

describe("decodeTextUseCase", () => {
  it("UTF-8 con y sin BOM", () => {
    const utf8 = new TextEncoder().encode(TEXT);
    expect(decodeTextUseCase(utf8)).toBe(TEXT);
    expect(decodeTextUseCase(bytes([0xef, 0xbb, 0xbf], utf8))).toBe(TEXT);
  });

  it("UTF-16 LE con BOM: lo que guarda SSMS por defecto", () => {
    expect(decodeTextUseCase(bytes([0xff, 0xfe], utf16le(TEXT)))).toBe(TEXT);
  });

  it("UTF-16 BE con BOM y UTF-16 LE sin BOM", () => {
    expect(decodeTextUseCase(bytes([0xfe, 0xff], utf16be(TEXT)))).toBe(TEXT);
    expect(decodeTextUseCase(utf16le(TEXT))).toBe(TEXT);
  });

  it("ANSI / Windows-1252 (ñ = 0xF1, ú = 0xFA, é = 0xE9)", () => {
    const ansi = new Uint8Array([...Buffer.from("VALUES (N'", "latin1"), 0xd1, 0x61, 0x6e, 0x64, 0xfa, 0x20, 0x50, 0xe9, 0x72, 0x65, 0x7a, 0x27, 0x29]);
    expect(decodeTextUseCase(ansi)).toBe("VALUES (N'Ñandú Pérez')");
  });
});
