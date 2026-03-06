import { supabase } from "./supabase";

const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload a product image to Supabase Storage
 * @returns Public URL of the uploaded image
 */
export async function uploadProductImage(file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("ფოტოს ზომა არ უნდა აღემატებოდეს 5MB-ს");
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("მხოლოდ JPEG, PNG ან WebP ფორმატი");
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Image upload error:", error);
    throw new Error("ფოტოს ატვირთვა ვერ მოხერხდა");
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Delete a product image from Supabase Storage
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Extract the file name from the URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];

    if (!fileName) return;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error("Image delete error:", error);
    }
  } catch {
    // Silently ignore delete errors
  }
}
