import { parse } from 'csv-parse/sync';

export async function parseCsv(content: string): Promise<Record<string, string>[]> {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}
