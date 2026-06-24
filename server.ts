import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("./", import.meta.url));
const envPath = `${cwd}.env`;

function loadDotenv() {
  try {
    const envText = readFileSync(envPath, "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2] ?? "";
      if (value.startsWith("\"") && value.endsWith("\"")) {
        value = value.slice(1, -1);
      } else if (value.startsWith("\'") && value.endsWith("\'")) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn("No se pudo cargar .env local para el servidor de desarrollo:", error instanceof Error ? error.message : error);
  }
}

loadDotenv();

const s3UploadModule = await import("./api/s3-upload-url.ts");
const createOrderModule = await import("./api/create-order.ts");
const s3UploadHandler = s3UploadModule.default;
const createOrderHandler = createOrderModule.default;

const port = Number(process.env.DEV_API_PORT ?? "5174");

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url ? new URL(req.url, `http://localhost:${port}`) : null;

  if (url?.pathname === "/api/s3-upload-url" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const apiResponse = {
        setHeader: (name: string, value: string) => res.setHeader(name, value),
        status: (statusCode: number) => {
          res.statusCode = statusCode;
          return apiResponse;
        },
        json: (payload: unknown) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload));
        },
      };

      await s3UploadHandler(
        { method: "POST", body },
        apiResponse
      );
    } catch (error) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
    return;
  }

  if (url?.pathname === "/api/create-order" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const apiResponse = {
        setHeader: (name: string, value: string) => res.setHeader(name, value),
        status: (statusCode: number) => {
          res.statusCode = statusCode;
          return apiResponse;
        },
        json: (payload: unknown) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload));
        },
      };

      await createOrderHandler(
        { method: "POST", body, headers: req.headers },
        apiResponse
      );
    } catch (error) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Endpoint no encontrado" }));
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor API de desarrollo escuchando en http://localhost:${port}`);
});
