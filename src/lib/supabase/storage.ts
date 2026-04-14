import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

/**
 * Upload a media file (image or video) to Supabase Storage and return its public URL.
 */
export async function uploadProductMedia(file: File): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = filename;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * @deprecated Use uploadProductMedia instead
 */
export async function uploadProductImage(file: File): Promise<string> {
  return uploadProductMedia(file);
}

/**
 * Delete a product media file from Supabase Storage by its full URL.
 */
export async function deleteProductMedia(mediaUrl: string): Promise<void> {
  const supabase = createClient();

  const urlParts = mediaUrl.split(`/storage/v1/object/public/${BUCKET}/`);
  if (urlParts.length < 2) return;

  const path = urlParts[1];
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Delete a product image from Supabase Storage by its full URL.
 * @deprecated Use deleteProductMedia instead
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  return deleteProductMedia(imageUrl);
}

/**
 * Determine if a file is a video based on its MIME type.
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

/**
 * Determine media type from a URL (checks extension).
 */
export function getMediaType(url: string): "image" | "video" {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? "";
  return ["mp4", "webm", "mov", "avi", "mkv"].includes(ext) ? "video" : "image";
}

const RETAILER_DOCS_BUCKET = "retailer-docs";

/**
 * Upload a KYC document for a retailer. Files are stored under {userId}/{docType}-{timestamp}.ext
 */
export async function uploadRetailerDoc(
  file: File,
  userId: string,
  docType: "id_front" | "id_back" | "business_cert"
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${docType}-${Date.now()}.${ext}`;
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(RETAILER_DOCS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(RETAILER_DOCS_BUCKET).getPublicUrl(path);

  return publicUrl;
}
