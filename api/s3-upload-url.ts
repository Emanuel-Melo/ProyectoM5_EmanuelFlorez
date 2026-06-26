//Imports para comunicarse con AWS SDK S3
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

//Lee variables de entorno necesarias para la configuración de AWS S3
const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN;
const expiresIn = Number(process.env.AWS_UPLOAD_EXPIRES_SECONDS ?? "900");

//Es más para lógica interna, pero verifica que todas las variables esten presentes
if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "Faltan variables de entorno AWS necesarias. Configura AWS_S3_BUCKET_NAME (o AWS_BUCKET_NAME), AWS_REGION, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY."
  );
}

//Configura región y credenciales para el cliente S3
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
    sessionToken,
  },
});

//Evita errores de seguridad al subir archivos a S3, reemplazando caracteres no permitidos en el nombre del archivo
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

  //Valida que se proporcionen fileName y contentType en el cuerpo de la petición
  if (!fileName || !contentType) {
    return res.status(400).json({
      error: "Se requieren fileName y contentType en el cuerpo de la petición.",
    });
  }

  const safeFileName = sanitizeFileName(fileName);
  const key = `products/${Date.now()}-${safeFileName}`; //Genera un nombre de archivo único para evitar colisiones en S3 simultaneamente

  //Describe la futura subida a S3, sin accionar la subida aún, solo genera la URL firmada para subir el archivo
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  //Genera la URL firmada para subir el archivo a S3, con un tiempo de expiración definido en expiresIn
  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    //Es la direccion pública del archivo una vez subido a S3, útil para mostrar la imagen en la web
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
    });//Si algo falla envia error 500 con mensaje de error
  }
}
