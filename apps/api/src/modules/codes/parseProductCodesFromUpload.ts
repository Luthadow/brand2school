import JSZip from "jszip";
import XLSX from "xlsx";
import { parseParticipationCode } from "../../lib/codeIdentity.js";

const CODE_COLUMN_KEYS = [
  "code",
  "CODE",
  "product_code",
  "PRODUCT_CODE",
  "participation_code",
  "PARTICIPATION_CODE",
  "product code",
  "Product Code",
  "Participation Code"
] as const;

const STRUCTURED_CODE_PATTERN =
  /\b([A-Z0-9]{2,8}-[A-Z0-9]{2,6}-[A-Z0-9]{1,4}-[A-Z0-9]{4,10}-[A-Z0-9]{2})\b/gi;

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

function normalizeCodeValue(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase();
}

function pickCodeFromRow(row: Record<string, unknown>): string {
  for (const key of CODE_COLUMN_KEYS) {
    if (key in row && row[key] !== undefined && row[key] !== "") {
      return normalizeCodeValue(row[key]);
    }
  }
  const firstValue = Object.values(row).find((v) => String(v ?? "").trim().length > 0);
  return normalizeCodeValue(firstValue);
}

function extractCodesFromPlainText(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(STRUCTURED_CODE_PATTERN)) {
    const value = match[1]?.trim().toUpperCase();
    if (value) found.add(value);
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim().toUpperCase();
    if (!trimmed) continue;
    if (parseParticipationCode(trimmed)) found.add(trimmed);
  }

  return [...found];
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) return "";
  return xml.replace(/<w:tab[^/]*\/>/g, "\t").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

function parseSpreadsheetBuffer(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: "" }) as Array<
    Record<string, unknown>
  >;

  return rows.map(pickCodeFromRow).filter((value) => value.length > 0);
}

export type ParsedUploadCodes = {
  codes: string[];
  source: "spreadsheet" | "document" | "text";
  rowCount: number;
};

export async function parseProductCodesFromUpload(
  buffer: Buffer,
  filename: string
): Promise<ParsedUploadCodes> {
  const ext = extensionOf(filename);

  if (ext === "docx") {
    const text = await extractTextFromDocx(buffer);
    const codes = extractCodesFromPlainText(text);
    return { codes, source: "document", rowCount: codes.length };
  }

  if (ext === "txt" || ext === "csv") {
    const text = buffer.toString("utf8");
    const codes =
      ext === "csv"
        ? parseSpreadsheetBuffer(buffer)
        : text
            .split(/\r?\n/)
            .map((line) => normalizeCodeValue(line))
            .filter((line) => line.length > 0);
    return {
      codes,
      source: ext === "csv" ? "spreadsheet" : "text",
      rowCount: codes.length
    };
  }

  const codes = parseSpreadsheetBuffer(buffer);
  return { codes, source: "spreadsheet", rowCount: codes.length };
}
