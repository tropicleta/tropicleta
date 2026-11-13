import "server-only";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { isServerless } from "../db/url";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export const blobConfigured = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

/** Valida las imágenes subidas. Devuelve un mensaje de error o null. */
export function validateImages(files: File[]): string | null {
  for (const f of files) {
    if (!TYPES[f.type]) return `“${f.name}” no es JPG, PNG, WebP ni AVIF.`;
    if (f.size > MAX_IMAGE_BYTES) return `“${f.name}” pesa más de 4 MB.`;
  }
  if (files.length && !blobConfigured() && isServerless()) return "Falta configurar el almacenamiento de imágenes (Vercel Blob).";
  return null;
}

/**
 * Sube una imagen de producto y devuelve su URL pública.
 * Con Vercel Blob configurado la guarda ahí; en desarrollo sin Blob, en /public/uploads.
 */
export async function uploadImage(file: File, prefix: string): Promise<string> {
  const error = validateImages([file]);
  if (error) throw new Error(error);
  const name = `${prefix}-${randomUUID().slice(0, 8)}.${TYPES[file.type]}`;
  if (blobConfigured()) {
    const blob = await put(`productos/${name}`, file, { access: "public", contentType: file.type });
    return blob.url;
  }
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dir = `${process.cwd()}/public/uploads`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/${name}`, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
