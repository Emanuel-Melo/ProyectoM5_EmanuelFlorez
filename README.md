# Proyecto M5 - Frontend

Aplicación React + TypeScript + Vite con Firebase Firestore y un backend local para operaciones seguras.

## Qué hace este proyecto

- Catálogo de productos cargado desde Firestore.
- Carrito de compras con persistencia local para invitados y sincronización de carrito para usuarios autenticados.
- Favoritos guardados en `localStorage` para invitados y sincronizados en Firestore para usuarios.
- Checkout seguro que crea órdenes desde un backend local (`/api/create-order`) usando Firebase Admin.
- Reducción de stock y limpieza de carrito del usuario como una operación atómica en el backend.
- Rutas protegidas y ruta de administrador.
- Soporte para generación de URLs de subida a S3 desde backend local (`/api/s3-upload-url`).

## Estructura principal

- `src/features/auth` — autenticación, login, registro, perfil de usuario.
- `src/features/cart` — estado del carrito, persistencia y sincronización.
- `src/features/favorites` — estado de favoritos y sincronización.
- `src/features/products` — listado de productos, filtros y detalle.
- `src/features/orders` — creación de órdenes y consulta de pedidos.
- `src/shared/services/firebase` — configuración de Firebase client-side.
- `api/` — implementaciones de endpoints backend para desarrollo.
- `server.ts` — servidor local que expone `/api/create-order` y `/api/s3-upload-url`.

## Requisitos

- Node.js 20+ o compatible con `tsx`.
- Firebase Web App configurada.
- Firebase Admin Service Account para el backend local.

## Variables de entorno

Crea un archivo `.env` en la raíz con los valores necesarios.

### Firebase web

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Opcionales para el backend / API

```env
DEV_API_PORT=5174
VITE_API_BASE_URL=http://localhost:5174
VITE_S3_UPLOAD_API_URL=http://localhost:5174
SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
# o bien GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

> `VITE_API_BASE_URL` es opcional. En desarrollo, Vite ya proxifica `/api/*` a `http://localhost:5174`.

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

1. Inicia el servidor de la aplicación:

```bash
npm run dev
```

2. En otra terminal inicia el servidor de API local:

```bash
npm run dev:api
```

Esto habilita:

- `/api/create-order` — crea ordenes con Firebase Admin y actualiza stock + carrito.
- `/api/s3-upload-url` — genera URLs firmadas para subir imágenes a S3.

## Seed de productos en Firestore

El proyecto puede iniciar productos desde `products.json` para poblar Firestore localmente.

1. Agrega un archivo `products.json` con el catálogo.
2. Asegúrate de tener las credenciales de Firebase en `.env`.
3. Ejecuta:

```bash
npm run seed
```

Si deseas iniciar datos administrativos especiales, también está disponible:

```bash
npm run seed:admin
```

## Cómo funciona el checkout

- El usuario finaliza compra en `src/features/home/pages/CartPage.tsx`.
- `CartPage` crea un payload de orden con los artículos del carrito.
- `src/features/orders/services/orderService.ts` llama a `/api/create-order` con el token de Firebase.
- El backend valida el token, verifica el stock y crea la orden usando Firebase Admin.
- Después, el backend elimina el carrito de `users/{uid}` y decrementa stock en `products/{id}`.
- La UI limpia el carrito local y redirige a `/envios/{orderId}`.

## Rutas principales

- `/` — landing page pública.
- `/login` — inicio de sesión.
- `/register` — registro de usuario.
- `/home` — home de producto protegido.
- `/products` — listado de productos.
- `/products/:productId` — detalle de producto.
- `/favorites` — favoritos del usuario.
- `/cart` — carrito de compras.
- `/envios` — página de envío.
- `/envios/:orderId` — detalles de orden.
- `/admin` — panel de administrador protegido.

## Comandos útiles

- `npm run dev` — arranca Vite en modo desarrollo.
- `npm run dev:api` — arranca el backend local para las APIs.
- `npm run build` — genera la app lista para producción.
- `npm run preview` — sirve el build local.
- `npm run lint` — ejecuta ESLint.
- `npm run seed` — carga productos iniciales a Firestore.
- `npm run seed:admin` — carga datos/admin adicional.

## Notas importantes

- El carrito se guarda en Firestore solo para usuarios autenticados.
- Los invitados usan `localStorage` y pueden guardar favoritos localmente.
- La creación de órdenes se realiza en backend para evitar `permission-denied` en Firestore desde el cliente.
- El backend local necesita credenciales de administrador de Firebase si se usan funciones de `/api/create-order`.

## Dependencias principales

- `react`, `react-dom`, `react-router-dom`
- `firebase` — cliente web.
- `firebase-admin` — backend local.
- `typescript`, `vite`, `tsx`

## Estructura recomendada para producción

- Mantén las claves de Firebase web en `.env`.
- No comites `serviceAccountKey.json` ni credenciales privadas.
- Usa un backend real o funciones serverless para `/api/create-order` en producción.
- El backend local `server.ts` está pensado para desarrollo y pruebas.
