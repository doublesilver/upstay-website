import path from "path";

export const DATA_DIR =
  process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const UPLOAD_DIR_RESOLVED = path.resolve(UPLOAD_DIR);
