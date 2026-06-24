import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN;
const expiresIn = Number(process.env.AWS_UPLOAD_EXPIRES_SECONDS ?? "900");

if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "Faltan variables de entorno AWS necesarias. Configura AWS_S3_BUCKET_NAME (o AWS_BUCKET_NAME), AWS_REGION, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY."
  );
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
    sessionToken,
  },
});

const sanitizeFileName = (fileName: string) =>
  fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");

export default async function (req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { fileName, contentType } = req.body ?? {};

  if (!fileName || !contentType) {
    return res.status(400).json({
      error: "Se requieren fileName y contentType en el cuerpo de la petición.",
    });
  }

  const safeFileName = sanitizeFileName(fileName);
  const key = `products/${Date.now()}-${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return res.status(200).json({
      uploadUrl,
      key,
      publicUrl,
      expiresIn,
    });
  } catch (error) {
    console.error("S3 upload URL error:", error);
    return res.status(500).json({
      error: "No se pudo generar la URL de subida a S3.",
    });
  }
}
