import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

let configured = false;

function getClient() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export interface UploadedMemoryFile {
  url: string;
  publicId: string;
  resourceType: string;
}

/**
 * Uploads one file to Cloudinary. `resource_type: "auto"` lets Cloudinary
 * classify images vs. PDFs/Excel/other documents ("image" vs "raw") on its
 * own, which determines how the delivery URL behaves and is required again
 * to delete the asset later.
 */
export async function uploadMemoryFile(buffer: Buffer, fileName: string): Promise<UploadedMemoryFile> {
  const client = getClient();
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder: "taskflow/memories", resource_type: "auto", filename_override: fileName, use_filename: true },
      (error, uploadResult) => {
        if (error || !uploadResult) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(uploadResult);
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type };
}

export async function deleteMemoryFile(publicId: string, resourceType: string): Promise<void> {
  const client = getClient();
  await client.uploader.destroy(publicId, { resource_type: resourceType });
}
