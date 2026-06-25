# 🛍️ Proyecto M5 - E-Commerce SPA Moderno

**Plataforma de e-commerce escalable, segura y funcional** desarrollada con **React 19 + TypeScript + Vite**.

> Proyecto Integrador especialización Frontend - Bootcamp Henry  
> Desarrollado para **Patagonix Tech** - Software Factory de soluciones retail

## 📋 Descripción del Proyecto

Una **Single Page Application (SPA)** moderna que permite a usuarios finales comprar productos online y a administradores gestionar el catálogo. La solución está construida sobre servicios administrados (BaaS) para reducir costos de infraestructura y acelerar time-to-market.

### ✨ Características Principales

- ✅ **Autenticación segura** con Firebase (email/password + Google OAuth)
- ✅ **Catálogo dinámico** desde Firestore con filtros y búsqueda en tiempo real
- ✅ **Carrito inteligente** con persistencia dual (localStorage para invitados, Firestore para usuarios)
- ✅ **Checkout seguro** con validación de stock en backend (Firebase Admin)
- ✅ **Panel administrativo** con CRUD completo de productos y órdenes
- ✅ **Upload seguro de imágenes** a AWS S3 mediante presigned URLs
- ✅ **Gestión de órdenes** con estados y seguimiento en tiempo real
- ✅ **Rutas protegidas** con control de roles (customer/admin)
- ✅ **Diseño mobile-first** responsivo en todos los dispositivos
- ✅ **Deploy en Vercel** con funciones serverless

---

## 🏗️ Decisiones Arquitectónicas

### **Por qué Context API + useReducer en lugar de Redux/Zustand?**

| Criterio               | Context + useReducer     | Redux    | Zustand            |
|------------------------|--------------------------|----------|--------------------|
| **Bundle size**        | ~1KB                     | ~10KB    | ~3KB               |
| **Curva aprendizaje**  | Baja (API nativa)        | Alta     | Media              |
| **Para este proyecto** | Ideal                    | Overkill | Alternativa válida |
| **Escalabilidad**      | +++ (contexts separados) | ++++     | +++                |

**Decisión**: Usamos **Context + useReducer** porque:
- No requiere dependencias adicionales
- Facilita testing (reducers son funciones puras)
- Mantenible para la complejidad de este proyecto
- Permite separar responsabilidades (AuthContext, CartContext)

### **Por qué Presigned URLs en lugar de subir desde backend?**

**Arquitectura actual (Segura)**:
```
Frontend → Vercel Function → Genera URL firmada → S3
         ↓
       Frontend → PUT directo a S3 con URL firmada
```

**Ventajas**:
- Credenciales de AWS nunca llegan al navegador
- URL tiene expiración (default 15 min)
- No satura el backend con uploads binarios
- Escalable: S3 maneja la carga

**Por qué NO subir desde backend**:
- Satura servidor con datos binarios
- Latencia adicional (datos viajan 2x)
- Menos escalable

### **Por qué Firebase Admin solo en backend?**

```
Frontend No puede: 
  - Crear órdenes sin que cualquiera lo haga
  - Decrementar stock sin validación
  - Acceder a datos privados

Backend Puede:
  - Verificar token ID
  - Validar stock en transacción
  - Crear orden atomically
  - Limpiar carrito del usuario
```

---

## 📁 Estructura del Proyecto

```
ProyectoM5_EmanuelFlorez/
│
├── README.md                    # Este archivo
├── AI-USAGE-LOG.md              # Bitácora de uso de IA (Decisiones clave)
├── package.json                 # Dependencias y scripts
├── vite.config.ts               # Config Vite + proxy API
├── vercel.json                  # Config despliegue Vercel
├── tsconfig.json                # Configuración TypeScript
├── .env.example                 # Template variables entorno
│
├── api/                         # Backend serverless (Vercel Functions)
│   ├── create-order.ts             # Endpoint: crear orden (Firebase Admin)
│   └── s3-upload-url.ts            # Endpoint: generar URLs presignadas
│
├── server.ts                    # Servidor local dev (dev:api)
│
├── src/
│   │
│   ├── assets/                  # Imágenes y recursos
│   │   ├── images/
│   │   └── loading/
│   │
│   ├── app/                     # Configuración global
│   │   ├── providers/              # AuthProvider, AppProviders
│   │   └── router/                 # AppRouter (todas las rutas)
│   │
│   ├── features/                # Lógica de negocio por feature
│   │   │
│   │   ├── auth/                # Autenticación
│   │   │   ├── context/            # AuthContext (usuario + rol)
│   │   │   ├── hooks/              # useAuth hook
│   │   │   ├── pages/              # LoginPage, RegisterPage
│   │   │   ├── components/         # LoginForm, RegisterForm
│   │   │   ├── services/           # authService, userService
│   │   │   ├── types/              # auth.types
│   │   │   ├── schemas/            # Zod schemas validación
│   │   │   └── index.js            # Exports
│   │   │
│   │   ├── cart/                # Carrito de compras
│   │   │   ├── context/            # CartContext (estado + sync)
│   │   │   └── services/           # cartService (Firestore)
│   │   │
│   │   ├── favorites/           # Favoritos
│   │   │   └── context/            # FavoritesContext
│   │   │
│   │   ├── products/            # Catálogo de productos
│   │   │   ├── pages/              # ProductsPage, ProductDetailPage
│   │   │   ├── components/         # ProductGrid, ProductFilters, SearchBar
│   │   │   ├── hooks/              # useProducts, useProductDetail
│   │   │   ├── types/              # product.types
│   │   │   ├── services/           # productService
│   │   │   └── products.css
│   │   │
│   │   ├── orders/              # Gestión de órdenes
│   │   │   ├── services/           # orderService (crear, leer órdenes)
│   │   │   └── types/              # order.types
│   │   │
│   │   ├── home/                # Experiencia del cliente
│   │   │   ├── pages/              # HomePage, CartPage, ShippingPage, OrderDetailPage
│   │   │   └── components/         # Componentes específicos home
│   │   │
│   │   └── admin/                # Panel de administración
│   │       ├── pages/              # AdminPage (dashboard completo)
│   │       ├── services/           # adminService (CRUD + stats)
│   │       └── AdminPage.css
│   │
│   ├── shared/                  # Código compartido
│   │   ├── components/             # Header, BrandMark, LoadingScreen
│   │   ├── guards/                 # ProtectedRoute, AdminRoute
│   │   ├── hooks/                  # Custom hooks compartidos
│   │   ├── layouts/                # MainLayout
│   │   ├── services/
│   │   │   ├── firebase/           # firebaseConfig, auth.ts, firestore.ts
│   │   │   └── s3Service.ts        # Wrapper para URLs presignadas
│   │   ├── types/                  # Tipos globales
│   │   ├── utils/                  # Utilidades
│   │   ├── constants/              # Constantes globales
│   │   └── styles/
│   │       └── global.css
│   │
│   ├── tests/                   # Test suite (próximo: agregar tests)
│   │
│   ├── 📄 App.tsx                  # Root component
│   ├── 📄 main.tsx                 # Entry point
│   └── 📄 index.css                # Global styles
│
└── 🌱 seed.ts / seed-admin.ts      # Scripts para poblar Firestore
```

---

## 🚀 Tech Stack

### Frontend
- **React 19.2.6** - UI framework moderno
- **TypeScript ~6.0.2** - Type safety
- **Vite 8.0.12** - Build tool ultrarrápido
- **React Router 7.18.0** - SPA routing
- **Context API + useReducer** - State management

### Backend & Servicios
- **Firebase Web SDK 12.15.0** - Auth + Firestore client
- **Firebase Admin SDK 14.0.0** - Operaciones seguras (backend)
- **AWS SDK (S3 + Presigner)** - Upload de imágenes
- **Vercel Serverless Functions** - Backend serverless

### Validación & Formularios
- **React Hook Form 7.80.0** - Gestión de formularios
- **Zod 4.4.3** - Validación de esquemas

### Testing (Instalado, próximo implementar)
- **Vitest 4.1.9** - Test runner ultrarrápido
- **React Testing Library 16.3.2** - Componentes testing
- **@testing-library/jest-dom** - Matchers útiles

### Desarrollo
- **ESLint** - Code quality
- **TypeScript Compiler** - Type checking
- **Prettier** - Code formatting

---

## 📋 Requisitos

- **Node.js 20+** (o compatible con `tsx`)
- **npm** o **yarn**
- **Cuenta Firebase** (Web App + Firestore)
- **AWS S3** (Bucket + IAM credentials) - Opcional para desarrollo local
- **Git** para control de versiones

---

## 🔧 Configuración de Variables de Entorno

### Crear `.env` en la raíz del proyecto

Copia el contenido de `.env.example` y reemplaza con tus valores reales:

```bash
cp .env.example .env
```

### Variables Requeridas

#### Firebase Web (Frontend - PÚBLICAS)
```env
VITE_FIREBASE_API_KEY=AIzaSyD...                    # API Key del proyecto
VITE_FIREBASE_AUTH_DOMAIN=tuproyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
```

> ℹ️ Estas son **públicas** (están en el frontend de todas formas), pero NO exponerlas innecesariamente

#### Backend - Server Local (Para desarrollo)
```env
SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
# O alternativamente:
# GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

DEV_API_PORT=5174
VITE_API_BASE_URL=http://localhost:5174
VITE_S3_UPLOAD_API_URL=http://localhost:5174
```

#### AWS S3 (Optional - Backend serverless)
```env
AWS_S3_BUCKET_NAME=mi-bucket-ecommerce
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEM...
AWS_SESSION_TOKEN=                    # Si usas credenciales temporales
AWS_UPLOAD_EXPIRES_SECONDS=900        # 15 minutos por defecto
```

### 🔒 Seguridad - NO hacer

- ❌ NO commitear `.env` a git
- ❌ NO exponer credenciales de AWS en frontend
- ❌ NO subir `serviceAccountKey.json` al repositorio
- ✅ SI verificar que `.env` está en `.gitignore`

---

## 📥 Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/tu-usuario/ProyectoM5_EmanuelFlorez.git
cd ProyectoM5_EmanuelFlorez
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar template
cp .env.example .env

# Editar .env con tus credenciales reales
# Necesitas:
# - Firebase Web credentials
# - Firebase Admin service account key (para dev:api)
# - AWS S3 credentials (opcional, necesario solo para uploads)
```

### 4. Obtener Firebase Admin Service Account

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Proyecto → Configuración del proyecto → Cuentas de servicio
3. Descargar archivo JSON
4. Guardar como `serviceAccountKey.json` en la raíz del proyecto
5. Agregar a `.gitignore`

---

## ▶️ Ejecutar en Desarrollo

### Terminal 1 - Frontend (Vite)

```bash
npm run dev
```

- Inicia en `http://localhost:5173`
- Hot reload automático
- TypeScript checking en tiempo real

### Terminal 2 - Backend Local (API Server)

```bash
npm run dev:api
```

- Inicia en `http://localhost:5174`
- Endpoints:
  - `POST /api/create-order` - Crear orden (Firebase Admin)
  - `POST /api/s3-upload-url` - Generar URL presignada S3

### Verificar setup

1. Abre `http://localhost:5173` en el navegador
2. Intenta registrarte con un email
3. Si ves "Landing Page" correctamente → ✅ Frontend OK
4. Si puedes hacer login → ✅ Firebase OK
5. Si puedes agregar producto al carrito → ✅ Context OK

---

## 🌾 Poblar Firestore (Datos Iniciales)

### Cargar productos desde `products.json`

```bash
npm run seed
```

Requiere:
- Credenciales Firebase en `.env`
- Archivo `products.json` en raíz con estructura:
  ```json
  [
    {
      "name": "Producto 1",
      "description": "Descripción",
      "category": "Electrónica",
      "price": 1000,
      "stock": 50,
      "image": "url-o-path"
    }
  ]
  ```

### Cargar datos de admin (opcional)

```bash
npm run seed:admin
```

---

## 🔄 Flujos Principales

### 1️⃣ Flujo de Autenticación

```
Usuario en /login
    ↓
Ingresa email + password (o elige Google)
    ↓
Firebase Auth genera token
    ↓
AuthContext obtiene usuario + perfil desde Firestore
    ↓
Redirige a /home (usuario autenticado)
```

**Archivos clave**:
- `src/features/auth/context/AuthContext.tsx` - Listener de cambios auth
- `src/features/auth/pages/LoginPage.tsx` - UI login
- `src/shared/guards/ProtectedRoute.tsx` - Protege rutas autenticadas

### 2️⃣ Flujo de Carrito

```
Usuario agrega producto
    ↓
CartContext.dispatch({ type: 'ADD_ITEM' })
    ↓
Reducer valida (stock máx, cantidad máx)
    ↓
Si autenticado → CartContext sincroniza a Firestore (users/{uid}/cart)
Si invitado → CartContext persiste en localStorage ('guest_cart_items_v1')
    ↓
UI se actualiza automáticamente
```

**Archivos clave**:
- `src/features/cart/context/CartContext.tsx` - Lógica carrito
- `src/features/home/pages/CartPage.tsx` - UI carrito

### 3️⃣ Flujo de Checkout (Seguro con Backend)

```
Usuario en CartPage → Click "Finalizar compra"
    ↓
Frontend obtiene ID token de Firebase:
    const token = await auth.currentUser?.getIdToken()
    ↓
Frontend envía POST /api/create-order con Bearer token:
    {
      userId: uid,
      items: [{ id, quantity }],
      total: 5000,
      discount: 0,
      shipping: "Gratis"
    }
    ↓
[BACKEND VERIFICA]
    1. Verifica token: admin.auth().verifyIdToken(bearerToken)
    2. Obtiene userId del token
    3. Lee cada producto desde Firestore
    4. Valida: ¿hay stock suficiente?
    5. Si falla validación → error 400
    ↓
[BACKEND EJECUTA - ATÓMICAMENTE]
    1. Crea documento en 'orders/{orderId}' con estado "processing"
    2. Decrementa stock en cada producto
    3. Limpia carrito: users/{uid}/cart = {}
    4. Transacción: si algo falla, TODO falla
    ↓
Frontend recibe orderId
    ↓
Limpia carrito local
    ↓
Redirige a /envios/{orderId}
    ↓
Usuario ve detalles de orden con seguimiento de estado
```

**Seguridad**:
- ✅ Backend verifica token → imposible crear orden sin ser usuario
- ✅ Stock validado en backend → imposible sobrepasar stock
- ✅ Transacción atómica → stock y orden siempre consistentes

**Archivos clave**:
- `src/features/orders/services/orderService.ts` - Frontend llamada a API
- `api/create-order.ts` - Backend seguro con Firebase Admin

### 4️⃣ Flujo de Upload S3 (Presigned URLs - Seguro)

```
Admin en panel → Sube imagen de producto
    ↓
Frontend solicita URL presignada:
    POST /api/s3-upload-url con nombre archivo
    ↓
[BACKEND GENERA]
    1. Sanitiza nombre (sin caracteres especiales)
    2. Genera key: `products/{timestamp}-{nombre}`
    3. Usa credenciales de AWS (NUNCA llegan a frontend)
    4. Genera URL firmada válida 15 min
    5. Retorna:
       {
         uploadUrl: "https://bucket.s3.amazonaws.com/...",
         key: "products/1234567890-producto.jpg",
         publicUrl: "https://bucket.s3.amazonaws.com/products/...",
         expiresIn: 900
       }
    ↓
Frontend recibe URL presignada
    ↓
Frontend hace PUT directo a S3 con la imagen:
    PUT uploadUrl (sin credenciales)
    ↓
S3 recibe archivo → valida firma → almacena
    ↓
Frontend obtiene publicUrl y guarda en producto
```

**Seguridad**:
- ✅ Credenciales de AWS solo en backend
- ✅ URL presignada expira en 15 min
- ✅ URL solo permite upload del archivo específico
- ✅ Frontend nunca conoce credenciales

**Archivos clave**:
- `api/s3-upload-url.ts` - Genera URL presignada
- `src/shared/services/s3Service.ts` - Frontend wrapper

### 5️⃣ Flujo de Admin Panel

```
Admin accede /admin
    ↓
AdminRoute verifica: role === "admin"
    ↓
Si no es admin → Redirige a /home
    ↓
AdminPage carga:
    - Estadísticas en tiempo real (onSnapshot)
    - Listado de productos
    - Listado de órdenes
    - Usuarios del sistema
    ↓
Admin puede:
    - Crear producto (CRUD) ✅
    - Actualizar estado de orden (pending→shipped→delivered) ✅
    - Cambiar rol de usuario (customer→admin) ✅
    - Ver estadísticas en vivo ✅
```

**Archivos clave**:
- `src/features/admin/pages/AdminPage.tsx` - UI admin
- `src/features/admin/services/adminService.ts` - Lógica CRUD

---

## 📍 Rutas Principales

### Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing Page |
| `/login` | Iniciar sesión |
| `/register` | Registro de usuario |

### Protegidas (Usuario autenticado)

| Ruta | Descripción |
|------|-------------|
| `/home` | Home del cliente |
| `/products` | Catálogo de productos |
| `/products/:productId` | Detalle de producto |
| `/favorites` | Mis favoritos |
| `/cart` | Carrito de compras |
| `/envios` | Historial de órdenes |
| `/envios/:orderId` | Detalle de orden |

### Solo Admin

| Ruta | Descripción |
|------|-------------|
| `/admin` | Panel de administración |

---

## 🔨 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Frontend Vite (http://localhost:5173)
npm run dev:api          # Backend local (http://localhost:5174)

# Build & Deploy
npm run build            # Compilar TypeScript + Vite build
npm run preview          # Servir build localmente

# Validación
npm run lint             # ESLint - verificar código

# Datos
npm run seed             # Cargar productos a Firestore
npm run seed:admin       # Cargar datos de admin

# Testing (próximo implementar)
# npm run test             # Vitest
# npm run test:ui          # Vitest UI
```

---

## 🚀 Deploy en Vercel

### Primer deploy (automático desde GitHub)

1. Push a GitHub:
   ```bash
   git push origin main
   ```

2. En [Vercel](https://vercel.com):
   - Conectar repositorio GitHub
   - Vercel detecta Vite automáticamente
   - Click Deploy

### Configurar variables de entorno en Vercel

1. Vercel Dashboard → Project Settings → Environment Variables

2. Agregar **variables de frontend** (con prefijo `VITE_`):
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_API_BASE_URL=https://tu-proyecto.vercel.app  (sin /api)
   VITE_S3_UPLOAD_API_URL=https://tu-proyecto.vercel.app
   ```

3. Agregar **variables de backend** (para Vercel Functions - SIN prefijo `VITE_`):
   ```
   AWS_S3_BUCKET_NAME
   AWS_REGION
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_SESSION_TOKEN (si aplica)
   ```

### Verificar deploy

```bash
# Ver logs de build
vercel logs [PROJECT_NAME]

# Acceder a la URL pública
https://tu-proyecto.vercel.app
```

### Testear en producción

- [ ] Registrarse con nuevo email
- [ ] Browsear catálogo
- [ ] Agregar al carrito
- [ ] Completar checkout
- [ ] Ver orden en historial
- [ ] Cambiar rol a admin (en Firebase console)
- [ ] Acceder a /admin
- [ ] Crear producto con upload de imagen
- [ ] Cambiar estado de orden

---

## 🔐 Seguridad & Buenas Prácticas

### ✅ Implementado

- [x] Variables de entorno separadas (`.env` en `.gitignore`)
- [x] Credenciales de AWS solo en backend
- [x] Firebase Admin SDK para operaciones críticas
- [x] Validación de stock en backend (transacción atómica)
- [x] Verificación de token ID en backend
- [x] Control de roles (ProtectedRoute, AdminRoute)
- [x] Presigned URLs con expiración
- [x] **Firestore Security Rules** - Control granular de acceso por usuario/rol

### 🔥 Firestore Security Rules

Se incluye archivo `firestore.rules` con políticas de seguridad backend:

```
// PRODUCTOS - Lectura pública, escritura solo admin
match /products/{productId} {
  allow read: if true;
  allow create, update, delete: if isAdmin();
}

// USUARIOS - Cada usuario lee su perfil, admin lee todos
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow write: if isOwner(userId);
}

// ÓRDENES - Usuario ve sus órdenes, admin ve todas
match /orders/{orderId} {
  allow read: if isOwner(resource.data.userId) || isAdmin();
  allow create: if isAuthenticated();
  allow update: if isAdmin();
}
```

**Desplegando en Vercel/Firebase**:

```bash
# 1. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Loguea en Firebase
firebase login

# 3. Inicializa Firebase en el proyecto (si no lo hiciste)
firebase init firestore

# 4. Despliega las reglas
firebase deploy --only firestore:rules
```

**Qué protege**:
- ✅ Usuarios NO pueden leer órdenes de otros
- ✅ Usuarios NO pueden escribir en el perfil de otros
- ✅ Solo admin puede crear/actualizar productos
- ✅ Stock y datos sensibles protegidos

### ⏳ Próximo implementar

- [ ] HTTPS en todas las conexiones (Vercel lo maneja)
- [ ] Rate limiting en /api/create-order
- [ ] Logging de operaciones sensibles

### 🚨 Evitar

- ❌ Credenciales de AWS en `.env` del frontend
- ❌ Credenciales de Firebase Admin en código frontend
- ❌ Subir `serviceAccountKey.json` a GitHub
- ❌ Confiar solo en validación cliente-side
- ❌ URLs presignadas sin expiración

---

## 📚 Archivos Clave para Entender

| Archivo | Propósito |
|---------|-----------|
| `src/app/router/AppRouter.tsx` | Definición de todas las rutas |
| `src/features/auth/context/AuthContext.tsx` | Estado global autenticación |
| `src/features/cart/context/CartContext.tsx` | Estado global carrito |
| `src/features/admin/pages/AdminPage.tsx` | Panel de administración |
| `api/create-order.ts` | Backend: crear orden (Firebase Admin) |
| `api/s3-upload-url.ts` | Backend: generar URLs presignadas |
| `server.ts` | Servidor dev que sirve las APIs |
| `vite.config.ts` | Proxy `/api/*` a backend local |

---

## 🐛 Troubleshooting

### Error: `Cannot find serviceAccountKey.json`

**Solución**: 
- Descargar desde Firebase Console
- Colocar en raíz del proyecto
- Agregar a `.gitignore`

### Error: `VITE_FIREBASE_PROJECT_ID is undefined`

**Solución**:
- Verificar que `.env` está en la raíz
- Verificar que tiene todas las variables VITE_*
- Reiniciar `npm run dev`

### Error: `permission-denied` al crear orden

**Solución**:
- Verificar que `/api/create-order` se está llamando (no directo a Firestore)
- Verificar que backend está corriendo (`npm run dev:api`)
- Verificar que service account key tiene permisos

### S3 upload retorna 403

**Solución**:
- Verificar credenciales AWS en `.env`
- Verificar que bucket existe
- Verificar que región es correcta
- Verificar permisos IAM: `s3:PutObject`, `s3:GetObject`

---

## 📖 Recursos Útiles

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router v7](https://reactrouter.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📝 Notas Importantes

- El carrito se sincroniza automáticamente al login/logout
- Las órdenes se crean en backend para evitar race conditions
- Admin panel está protegido por rol en cliente (falta Firestore rules)
- Presigned URLs expiran en 15 minutos
- Stock se valida en backend antes de crear orden

---

## 📜 Licencia

Proyecto Integrador Frontend - Bootcamp Henry

---

## 🤝 Autor

Desarrollado por Emanuel Florez para Patagonix Tech


