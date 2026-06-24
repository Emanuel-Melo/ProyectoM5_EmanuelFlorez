# 📊 Bitácora de Uso de IA - Proyecto M5 E-Commerce

**Documento que evidencia cómo la IA fue utilizada estratégicamente para tomar decisiones técnicas, validar arquitectura, generar tests y resolver problemas complejos durante el desarrollo.**

---

## 📌 Entrada 1: Arquitectura Global - Context API vs Redux vs Zustand

**Fecha**: Fase inicial  
**Categoría**: Decisión arquitectónica  
**Status**: ✅ Implementado

### 🤔 Pregunta realizada a la IA

```
"Estoy construyendo un e-commerce con:
- Autenticación (usuario + rol)
- Carrito de compras
- Favoritos
- Panel admin

¿Debería usar Context API + useReducer, Redux, o Zustand? 
Tengo que justificar por qué en la presentación. 
¿Qué elegirías para un proyecto de bootcamp y por qué?"
```

### 📚 Respuesta clave de la IA

La IA sugirió una **matriz comparativa**:

| Aspecto | Context + useReducer | Redux | Zustand |
|--------|----------------------|-------|---------|
| Bundle size | ~1KB | ~10KB | ~3KB |
| Curva aprendizaje | Nativa (API React) | Compleja | Simple |
| Testing | Fácil (reducers puros) | Intermedio (actions/reducers) | Fácil |
| Para este proyecto | ✅ Ideal | ⚠️ Overkill | ✅ Alternativa |

### 💡 Aprendizaje & Decisión

**Lo que aprendí:**
- Context API + useReducer es una **combinación nativa de React** que no requiere dependencias
- Los reducers son **funciones puras** → facilita enormemente el testing
- Para 2-3 contextos separados (Auth, Cart), no se justifica la complejidad de Redux
- Zustand sería más sencillo, pero useReducer ofrece patrón más familiar en equipos grandes

**Decisión tomada:**
✅ **Context API + useReducer** separando responsabilidades:
- `AuthContext` - Autenticación + rol + profile
- `CartContext` - Estado del carrito + sync Firestore
- `FavoritesContext` - Favoritos (localStorage + Firestore)

**Código resultante**: [src/features/auth/context/AuthContext.tsx](src/features/auth/context/AuthContext.tsx)

**Por qué es mejor para el proyecto:**
- Sin dependencias externas = bundle más ligero
- Cada contexto tiene responsabilidad clara
- Reducers son testables como funciones puras
- El flujo es explícito: `dispatch({ type: 'ACTION', payload })`

---

## 📌 Entrada 2: Seguridad - Presigned URLs vs Backend Upload

**Fecha**: Fase de uploads  
**Categoría**: Validación de decisión técnica + seguridad  
**Status**: ✅ Implementado

### 🤔 Pregunta realizada a la IA

```
"Necesito que admins suban imágenes de productos a AWS S3.
¿Cuál es la mejor arquitectura?

Opción A: Frontend sube directo a S3 con credenciales en .env
Opción B: Frontend pide URL presignada a backend, luego sube directo
Opción C: Frontend sube a backend, backend sube a S3

¿Cuál es más segura? ¿Por qué? ¿Cómo explico esto en la presentación?"
```

### 📚 Respuesta clave de la IA

La IA explicó con detalle el **flujo de seguridad** de cada opción:

**Opción A (❌ Insegura)**
```
Credenciales AWS en .env → Compiladas en JS → Visible en DevTools
→ Riesgo: Cualquiera puede subir/descargar/borrar de S3
```

**Opción B (✅ SEGURA - Elegida)**
```
Frontend solicita URL → Backend genera con credenciales (servidor)
→ URL firmada válida 15 min → Frontend sube directo a S3
→ Credenciales nunca llegan al navegador → Solo uploaders autorizados
```

**Opción C (⚠️ Funciona pero ineficiente)**
```
Frontend sube a backend → Backend sube a S3
→ Más seguro que A, pero: satura servidor, latencia doble, menos escalable
```

### 💡 Aprendizaje & Decisión

**Lo que aprendí:**
- **Presigned URLs** son el patrón estándar en la industria (AWS, Google Cloud, Azure)
- Una URL presignada es como dar un "pase temporal" para una acción específica
- La expiración es **crítica**: 15 min es suficiente para uploads típicos pero corta para atacantes
- Las credenciales de AWS en backend se pueden rotar, en frontend son inmutables

**Decisión tomada:**
✅ **Presigned URLs con expiración** (Opción B):
1. Admin pide upload en panel
2. Frontend: `POST /api/s3-upload-url` con nombre archivo + token auth
3. Backend genera URL firmada (credenciales del servidor)
4. Frontend recibe URL pública + URL de upload
5. Frontend: `PUT presignedUrl` con archivo binario
6. S3 valida firma → acepta archivo

**Código resultante**: [api/s3-upload-url.ts](api/s3-upload-url.ts)

**Ventajas de esta arquitectura:**
- ✅ Credenciales de AWS NUNCA en frontend
- ✅ URL presignada expira automáticamente
- ✅ Backend autentica al usuario (solo admins pueden uploadear)
- ✅ S3 valida que URL + archivo coinciden
- ✅ Frontend no satura con carga binaria
- ✅ Escalable: S3 maneja los uploads

---

## 📌 Entrada 3: Flujo de Checkout - Evitar Race Conditions

**Fecha**: Fase de órdenes  
**Categoría**: Validación arquitectónica + seguridad  
**Status**: ✅ Implementado

### 🤔 Pregunta realizada a la IA

```
"En mi e-commerce, cuando un usuario compra:
1. Debo decrementar stock en Firebase
2. Debo crear una orden
3. Debo limpiar el carrito del usuario

¿Y si dos usuarios compran el último producto al mismo tiempo?
¿Cómo evito que ambos compren si solo hay 1 en stock?

¿Hago todo en frontend o backend? ¿Cómo lo explico?"
```

### 📚 Respuesta clave de la IA

La IA explicó el concepto de **race conditions** y **transacciones atómicas**:

```
PROBLEMA - Frontend (❌ INSEGURO):
Tiempo 0: Usuario A lee stock = 1
Tiempo 0: Usuario B lee stock = 1
Tiempo 1: Usuario A decrementa stock = 0, crea orden
Tiempo 2: Usuario B decrementa stock = -1, crea orden (¡NEGATIVO!)
→ Overselling: vendimos 2 unidades de 1 producto

SOLUCIÓN - Backend con Transacción (✅ SEGURO):
Tiempo 0: Usuario A envía checkout
Tiempo 0: Usuario B envía checkout
Tiempo 1: Backend A: LEE stock (1), crea orden, DECREMENTA (-1), commit transacción ✅
Tiempo 2: Backend B: LEE stock (0), intenta decrementar → ERROR ❌
→ Backend B devuelve error 400: "Stock insuficiente"
```

### 💡 Aprendizaje & Decisión

**Lo que aprendí:**
- **Race condition** = múltiples procesos acceden al mismo dato simultáneamente
- **Transacción atómica** = o se ejecutan TODOS los cambios o NINGUNO
- Firebase Firestore soporta `transaction()` que garantiza consistencia
- Las validaciones en frontend son "sugerencias", no protecciones

**Decisión tomada:**
✅ **Backend ejecuta transacción atómica** en `/api/create-order`:

```typescript
// Backend (SEGURO)
await db.runTransaction(async (transaction) => {
  // 1. LEE stock (bajo transacción)
  const productDoc = await transaction.get(productRef);
  const stock = productDoc.data().stock;
  
  // 2. VALIDA
  if (stock < quantity) throw new Error("Stock insuficiente");
  
  // 3. ESCRIBE TODO JUNTO (atómico)
  transaction.update(productRef, { stock: stock - quantity });
  transaction.set(orderRef, { /* orden */ });
  transaction.update(userCartRef, { /* limpiar */ });
});
// Si algo falla → transacción completa se revierte
```

**Código resultante**: [api/create-order.ts](api/create-order.ts)

**Por qué es mejor:**
- ✅ Imposible overselling
- ✅ Imposible quedarse sin stock actualizado
- ✅ Orden y stock siempre consistentes
- ✅ Si hay error, TODO se revierte (no queda inconsistencia)

---

## 📌 Entrada 4: Testing - Qué Testear Primero

**Fecha**: Fase de testing  
**Categoría**: Generación de estrategia de tests  
**Status**: ⏳ En progreso (próxima implementación)

### 🤔 Pregunta realizada a la IA

```
"Tengo que hacer tests para mi e-commerce.
Vitest + React Testing Library están instalados.

¿Por dónde empiezo? ¿Qué es PRIORITARIO testear?
¿Tests unitarios o integración?
¿Cómo mockeo Firebase y AWS?"
```

### 📚 Respuesta clave de la IA

La IA sugirió una **estrategia por capas de crítica**:

**CAPA 1 - CRÍTICA (testear primero):**
1. `cartReducer` - ¿Agregar/quitar items funciona?
2. `useAuth` hook - ¿Obtiene usuario + rol correctamente?
3. `/api/create-order` backend - ¿Valida stock?

**CAPA 2 - IMPORTANTE:**
4. `ProtectedRoute` - ¿Bloquea usuarios sin auth?
5. `AdminRoute` - ¿Bloquea usuarios sin role admin?
6. Flujo checkout completo - test E2E

**CAPA 3 - NICE TO HAVE:**
7. Componentes UI (ProductCard, Header, etc)
8. Filtros de búsqueda
9. Sincronización de favoritos

### 💡 Aprendizaje & Decisión

**Lo que aprendí:**
- **Reducer = función pura** → Testeable sin mocks
- **Hooks con context** → Necesitan wrapper de providers
- **Firebase/AWS** → Se mockean con `vi.mock()`
- **Cobertura importante** = 70%+ de caminos críticos

**Estrategia de testing decidida:**

```typescript
// Test 1: cartReducer (función pura)
describe('cartReducer', () => {
  test('ADD_ITEM agrega producto correctamente', () => {
    const state = { items: [] };
    const action = { type: 'ADD_ITEM', payload: { id: '1', quantity: 1 } };
    const newState = cartReducer(state, action);
    expect(newState.items).toHaveLength(1);
  });
});

// Test 2: useAuth (con mock Firebase)
vi.mock('firebase/auth', () => ({ 
  onAuthStateChanged: vi.fn(cb => cb({ uid: '123' }))
}));
describe('useAuth', () => {
  test('retorna usuario autenticado', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user).toBeDefined();
  });
});

// Test 3: Flujo checkout E2E
test('checkout crea orden y limpia carrito', async () => {
  // Mock firebase + orden service
  // Agregar items al carrito
  // Click checkout
  // Verificar: orden creada + carrito vacío
});
```

**Código próximo a implementar**: `src/tests/cartReducer.test.ts`, `src/tests/hooks.test.ts`

---

## 📌 Entrada 5: Estructura de Carpetas - Cómo Organizar por Features

**Fecha**: Fase inicial  
**Categoría**: Decisión de arquitectura  
**Status**: ✅ Implementado

### 🤔 Pregunta realizada a la IA

```
"¿Cómo debo organizar el código?

Opción A: Por capas técnicas
src/
  components/
  pages/
  contexts/
  services/
  hooks/
  types/

Opción B: Por features (dominio)
src/
  features/
    auth/
      components/
      pages/
      context/
      services/
    cart/
      context/
      services/
    products/
      ...

¿Cuál es mejor para un proyecto que va a crecer?
¿Cuál es más fácil de entender para otros devs?"
```

### 📚 Respuesta clave de la IA

La IA explicó **Screaming Architecture** y el concepto de **cohesión alta**:

```
OPCIÓN A (Por capas técnicas) ❌ Para e-commerce
Problema: Si necesitas entender carrito, 
abres 4-5 carpetas diferentes:
  src/components/CartItem.tsx
  src/pages/CartPage.tsx
  src/contexts/CartContext.tsx
  src/services/cartService.ts
→ Difícil de navegar, alta dispersión

OPCIÓN B (Por features) ✅ Mejor para e-commerce
Ventaja: Todo lo del carrito en una carpeta
src/features/cart/
  ├── components/      # Componentes del carrito
  ├── context/         # CartContext
  ├── services/        # cartService
  └── types/           # cart.types
→ Fácil de entender: "Voy a features/cart y aquí está TODO"
```

### 💡 Aprendizaje & Decisión

**Lo que aprendí:**
- **Screaming Architecture** = la estructura del código grita su propósito
- **Cohesión alta** = cosas que cambian juntas están cerca
- **Escalabilidad** = cuando agregues nuevas features, solo creas una carpeta
- **Onboarding** = nuevo dev entiende el proyecto mirando carpetas

**Decisión tomada:**
✅ **Estructura por features** con sub-carpetas técnicas:

```
src/
├── features/
│   ├── auth/              # Feature: Autenticación
│   │   ├── components/    # LoginForm, RegisterForm
│   │   ├── pages/         # LoginPage, RegisterPage
│   │   ├── context/       # AuthContext
│   │   ├── services/      # authService, userService
│   │   ├── hooks/         # useAuth
│   │   ├── types/         # auth.types
│   │   └── schemas/       # Zod schemas
│   │
│   ├── cart/              # Feature: Carrito
│   │   ├── context/       # CartContext
│   │   └── services/      # cartService
│   │
│   ├── products/          # Feature: Catálogo
│   │   ├── pages/         # ProductsPage, ProductDetailPage
│   │   ├── components/    # ProductGrid, ProductFilters, SearchBar
│   │   ├── hooks/         # useProducts, useProductDetail
│   │   ├── services/      # productService
│   │   └── types/         # product.types
│   │
│   ├── orders/            # Feature: Órdenes
│   │   ├── services/      # orderService
│   │   └── types/         # order.types
│   │
│   └── admin/             # Feature: Panel admin
│       ├── pages/         # AdminPage
│       └── services/      # adminService
│
├── shared/                # Código compartido (cross-cutting)
│   ├── components/        # Header, BrandMark
│   ├── guards/            # ProtectedRoute, AdminRoute
│   ├── services/          # Firebase, S3
│   ├── hooks/             # Custom hooks globales
│   ├── types/             # Tipos globales
│   └── utils/             # Utilidades
│
└── app/                   # Configuración de app
    ├── providers/         # AuthProvider, AppProviders
    └── router/            # AppRouter
```

**Código resultante**: Toda la estructura del proyecto

**Por qué es mejor:**
- ✅ Fácil de navegar: "carrito" = `features/cart/`
- ✅ Fácil de añadir features: crear carpeta `features/wishlist/`
- ✅ Claro para otros devs: "aquí está la lógica de X"
- ✅ Facilita refactorización: mover feature completa es aislado

---

## 📌 Bonus: Validación de Decisiones en Producción

**Fecha**: Fase final  
**Categoría**: Validación + troubleshooting  
**Status**: ✅ Verificado

### 🤔 Pregunta realizada a la IA

```
"Desplegué en Vercel. 
Algunos tests en producción:

1. Admin sube imagen → ¿Por qué tarda 5 seg?
2. Checkout falla a veces → ¿Race condition?
3. Carrito vacío después de login → ¿Sync problem?

¿Cómo debuggeo esto? ¿Qué logs me ayudan?"
```

### 📚 Respuesta clave de la IA

La IA sugirió puntos de debug específicos:

```
PROBLEMA 1: Upload tarda 5s
→ Medir: tiempo para pedir URL + tiempo para PUT a S3
→ Si URL tarda 3s: problema en backend
→ Si PUT tarda 3s: problema en red/S3
→ Solución: Agregar logs de timestamp en /api/s3-upload-url

PROBLEMA 2: Checkout falla a veces
→ Checkear: ¿Error de stock? ¿Error de permiso? ¿Error de red?
→ Agregar try/catch en createOrder() con mensajes claros
→ Problema probable: timing entre lectura y write en transacción

PROBLEMA 3: Carrito vacío post-login
→ Checkear: ¿Firebase auth actualiza antes que Firestore sync?
→ Solución: Esperar a que AuthContext cargue usuario ANTES de sincronizar carrito
→ Agregar loading state mientras se sincroniza
```

### 💡 Aprendizaje & Decisión

**Lo que aprendí:**
- Los problemas en producción suelen ser **timing** o **permisos**
- Los logs en backend son esenciales
- Los estados de loading deben ser explícitos en UI
- A veces el problema está en el **orden** de las operaciones, no en la lógica

**Validaciones realizadas:**
✅ Upload de imágenes funciona en producción  
✅ Checkout crea órdenes correctamente  
✅ Carrito sincroniza al login  
✅ Roles se respetan en admin panel

---

## 📊 Resumen de Decisiones Técnicas

| Decisión | Alternativas | Ganador | Razón |
|----------|-------------|--------|--------|
| State Management | Redux / Zustand / Context+useReducer | **Context+useReducer** | Nativo, testeable, sin deps |
| S3 Upload | Direct / Backend / Presigned | **Presigned URLs** | Seguro, escalable, estándar industria |
| Stock Validation | Frontend / Backend | **Backend (transacción)** | Evita race conditions |
| Estructura | By layer / By feature | **By feature** | Cohesión alta, escalable |
| Testing Strategy | Unit / E2E / Both | **Both (prioritarios)** | Cobertura crítica primero |

---

## 🎓 Lecciones Aprendidas

### ✅ Lo que funcionó bien

1. **Usar IA para explorar trade-offs** antes de implementar
2. **Pedir ejemplos de código** para entender patrones
3. **Validar decisiones** en prototipos antes de ir a producción
4. **Crear matrices comparativas** para decisiones complejas

### ❌ Lo que no funcionó

1. Pedirle a IA que escriba componentes complejos sin entender primero
2. No validar las respuestas de IA contra la documentación oficial
3. Copiar código de IA directamente sin adaptarlo al proyecto

### 🚀 Mejoras para próximos proyectos

- Usar IA para **code reviews** automáticos
- Pedir ayuda en **performance optimization**
- Usar IA para **generar test cases** sistemáticamente
- Documentar **trade-offs** mientras se codea, no después

---

## 📚 Recursos de IA Utilizados

- **Claude** - Explicaciones arquitectónicas profundas
- **ChatGPT** - Generación de código y ejemplos
- **Gemini** - Validación de patrones de React

---

**Documento finalizado**: 24 de Junio, 2026  
**Versión**: 1.0  
**Autor**: Emanuel Florez  
**Proyecto**: Patagonix Tech - E-Commerce SPA
