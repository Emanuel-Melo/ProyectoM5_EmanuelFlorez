import type { UploadInfo } from "../types/s3.types";

const apiBaseUrl = import.meta.env.VITE_S3_UPLOAD_API_URL?.trim().replace(/\/$/, "") ?? "";

if (!apiBaseUrl) {
  console.warn(
    "VITE_S3_UPLOAD_API_URL no está definido. Se usará la misma base del sitio para las peticiones a /api/s3-upload-url."
  );
}

export const s3Config = {
  apiBaseUrl,
};

export async function requestS3UploadUrl(fileName: string, contentType: string): Promise<UploadInfo> {
  const response = await fetch(`${s3Config.apiBaseUrl}/api/s3-upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileName, contentType }),
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener la URL de subida a S3.");
  }

  return response.json();
}
