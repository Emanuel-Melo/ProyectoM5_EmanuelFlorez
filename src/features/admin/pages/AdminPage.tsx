import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { authService } from "../../auth/services/authService";
import { useAuth } from "../../auth/hooks/useAuth";
import { adminService } from "../services/adminService";
import type {
  AdminDashboardStats,
  AdminOrderSummary,
  AdminProductSummary,
  AdminUserSummary,
} from "../services/adminService";
import type { UserRole } from "../../auth/types/auth.types";
import "./AdminPage.css";

const navItems = [
  { id: "dashboard", label: "Estadísticas" },
  { id: "users", label: "Usuarios" },
  { id: "products", label: "Productos" },
  { id: "orders", label: "Pedidos" },
  { id: "shipping", label: "Envíos" },
];

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
};

const productCategories = [
  "accesorios",
  "hogar",
  "electrónica",
  "ropa",
  "otros",
];

function AdminPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [products, setProducts] = useState<AdminProductSummary[]>([]);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [shippingOrders, setShippingOrders] = useState<AdminOrderSummary[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: productCategories[0],
    price: "",
    stock: "",
    imageUrl: "",
    active: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [dashboardStats, usersList, productsList, recentOrders, shippingOrdersList] = await Promise.all([
          adminService.fetchDashboardStats(),
          adminService.fetchUsers(),
          adminService.fetchProducts(),
          adminService.fetchRecentOrders(),
          adminService.fetchShippingOrders(),
        ]);

        setStats(dashboardStats);
        setUsers(usersList);
        setProducts(productsList);
        setOrders(recentOrders);
        setShippingOrders(shippingOrdersList);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadAdminData();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login", { replace: true });
  };

  const userCount = stats?.totalUsers ?? 0;
  const adminCount = stats?.totalAdmins ?? 0;
  const productCount = stats?.totalProducts ?? 0;
  const orderCount = stats?.totalOrders ?? 0;
  const currentAdminUid = user?.uid;

  const handleRoleChange = async (
    uid: string,
    role: UserRole,
    targetEmail: string
  ) => {
    setUpdatingUserId(uid);
    setStatusMessage(null);
    setErrorMessage(null);

    if (!user?.uid || !user.email) {
      setErrorMessage("No se pudo identificar al administrador.");
      setUpdatingUserId(null);
      return;
    }

    try {
      await adminService.updateUserRole(uid, role, {
        uid: user.uid,
        email: user.email,
        targetEmail,
      });
      setUsers((prev) =>
        prev.map((account) =>
          account.uid === uid ? { ...account, role } : account
        )
      );
      setStatusMessage(
        `El usuario ${targetEmail} ahora es ${role === "admin" ? "Admin" : "Cliente"}.`
      );
      window.setTimeout(() => setStatusMessage(null), 4500);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo actualizar el rol. Intenta de nuevo.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleNewProductChange = (
    field: keyof typeof newProduct,
    value: string | boolean
  ) => {
    setNewProduct((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateProduct = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSavingProduct(true);

    if (!newProduct.name.trim() || !newProduct.description.trim() || !newProduct.imageUrl.trim()) {
      setErrorMessage("Por favor completa nombre, descripción e imagen.");
      setIsSavingProduct(false);
      return;
    }

    const priceValue = Number(newProduct.price);
    const stockValue = Number(newProduct.stock);

    if (Number.isNaN(priceValue) || priceValue < 0 || Number.isNaN(stockValue) || stockValue < 0) {
      setErrorMessage("Precio y stock deben ser valores numéricos válidos.");
      setIsSavingProduct(false);
      return;
    }

    try {
      const createdProduct = await adminService.createProduct({
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        category: newProduct.category,
        price: priceValue,
        stock: stockValue,
        imageUrl: newProduct.imageUrl.trim(),
        active: Boolean(newProduct.active),
      });

      setProducts((prev) => [createdProduct, ...prev]);
      setStatusMessage(`Producto "${createdProduct.name}" creado correctamente.`);
      setNewProduct({
        name: "",
        description: "",
        category: productCategories[0],
        price: "",
        stock: "",
        imageUrl: "",
        active: true,
      });
      setStats((prev) =>
        prev
          ? { ...prev, totalProducts: prev.totalProducts + 1 }
          : prev
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo crear el producto. Intenta nuevamente.");
    } finally {
      setIsSavingProduct(false);
      window.setTimeout(() => setStatusMessage(null), 4500);
    }
  };

  const sectionContent = useMemo(() => {
    if (loading) {
      return <p className="admin-loading">Cargando datos...</p>;
    }

    if (selectedTab === "dashboard") {
      return (
        <section className="admin-dashboard-grid">
          <article className="dashboard-card">
            <strong>{userCount}</strong>
            <span>Usuarios activos</span>
          </article>
          <article className="dashboard-card">
            <strong>{adminCount}</strong>
            <span>Administradores</span>
          </article>
          <article className="dashboard-card">
            <strong>{productCount}</strong>
            <span>Productos disponibles</span>
          </article>
          <article className="dashboard-card">
            <strong>{orderCount}</strong>
            <span>Pedidos registrados</span>
          </article>
          <article className="dashboard-card stat-card">
            <strong>{stats?.statusCounts.pending ?? 0}</strong>
            <span>Pedidos pendientes</span>
          </article>
          <article className="dashboard-card stat-card">
            <strong>{stats?.statusCounts.processing ?? 0}</strong>
            <span>Pedidos en proceso</span>
          </article>
          <article className="dashboard-card stat-card">
            <strong>{stats?.statusCounts.shipped ?? 0}</strong>
            <span>Pedidos enviados</span>
          </article>
          <article className="dashboard-card stat-card">
            <strong>{stats?.statusCounts.delivered ?? 0}</strong>
            <span>Pedidos entregados</span>
          </article>
        </section>
      );
    }

    if (selectedTab === "users") {
      return (
        <section className="admin-panel-section">
          <div className="admin-section-header">
            <h2>Usuarios</h2>
            <p>Gestiona el rol de los usuarios registrados en la tienda.</p>
          </div>
          {statusMessage || errorMessage ? (
            <div className="admin-panel-feedback">
              {statusMessage ? (
                <div className="admin-feedback success">{statusMessage}</div>
              ) : null}
              {errorMessage ? (
                <div className="admin-feedback error">{errorMessage}</div>
              ) : null}
            </div>
          ) : null}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => {
                  const isCurrentAdmin = account.uid === currentAdminUid;
                  const isSaving = updatingUserId === account.uid;

                  return (
                    <tr key={account.uid}>
                      <td>{account.email}</td>
                      <td>
                        <select
                          className="admin-role-select"
                          value={account.role}
                          disabled={isCurrentAdmin || isSaving}
                          onChange={(event) =>
                            handleRoleChange(
                              account.uid,
                              event.target.value as UserRole,
                              account.email
                            )
                          }
                        >
                          <option value="customer">Cliente</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{String(account.createdAt ?? "-")}</td>
                      <td>
                        {isCurrentAdmin
                          ? "No puede cambiar su rol"
                          : isSaving
                          ? "Guardando..."
                          : "Listo"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (selectedTab === "products") {
      return (
        <section className="admin-panel-section">
          <div className="admin-section-header">
            <div>
              <h2>Productos</h2>
              <p>Revisa el inventario directo desde Firestore.</p>
            </div>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() => setSelectedTab("products")}
            >
              Crear nuevo producto
            </button>
          </div>
          <div className="admin-product-form">
            <div className="admin-product-grid">
              <label className="admin-product-field">
                <span>Nombre</span>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(event) => handleNewProductChange("name", event.target.value)}
                  placeholder="Zapatos deportivos"
                />
              </label>
              <label className="admin-product-field">
                <span>Categoría</span>
                <select
                  value={newProduct.category}
                  onChange={(event) => handleNewProductChange("category", event.target.value)}
                >
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-product-field">
                <span>Precio</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newProduct.price}
                  onChange={(event) => handleNewProductChange("price", event.target.value)}
                  placeholder="120000"
                />
              </label>
              <label className="admin-product-field">
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newProduct.stock}
                  onChange={(event) => handleNewProductChange("stock", event.target.value)}
                  placeholder="20"
                />
              </label>
              <label className="admin-product-field admin-product-field-full">
                <span>Imagen URL</span>
                <input
                  type="text"
                  value={newProduct.imageUrl}
                  onChange={(event) => handleNewProductChange("imageUrl", event.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="admin-product-field admin-product-field-full">
                <span>Descripción</span>
                <textarea
                  value={newProduct.description}
                  onChange={(event) => handleNewProductChange("description", event.target.value)}
                  placeholder="Descripción del producto"
                />
              </label>
              <label className="admin-product-field admin-checkbox-field">
                <input
                  type="checkbox"
                  checked={newProduct.active}
                  onChange={(event) => handleNewProductChange("active", event.target.checked)}
                />
                <span>Publicar producto inmediatamente</span>
              </label>
            </div>
            <div className="admin-product-actions">
              {statusMessage ? <div className="admin-feedback success">{statusMessage}</div> : null}
              {errorMessage ? <div className="admin-feedback error">{errorMessage}</div> : null}
              <button
                type="button"
                className="admin-button admin-button-primary"
                onClick={handleCreateProduct}
                disabled={isSavingProduct}
              >
                {isSavingProduct ? "Creando producto..." : "Guardar producto"}
              </button>
            </div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>{product.active ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (selectedTab === "shipping") {
      return (
        <section className="admin-panel-section">
          <div className="admin-section-header">
            <h2>Envíos</h2>
            <p>Visualiza los pedidos con información de envío desde Firestore.</p>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Envío</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {shippingOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.userId}</td>
                    <td>{order.shipping ?? "-"}</td>
                    <td>{statusLabels[order.status] ?? order.status}</td>
                    <td>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (selectedTab === "orders") {
      return (
        <section className="admin-panel-section">
          <div className="admin-section-header">
            <h2>Pedidos recientes</h2>
            <p>Revisa los últimos pedidos registrados.</p>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.userId}</td>
                    <td>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(order.total)}</td>
                    <td>{statusLabels[order.status] ?? order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    return (
      <section className="admin-panel-section admin-placeholder-card">
        <div className="admin-section-header">
          <h2>{selectedTab === "products" ? "Productos" : "Envíos"}</h2>
          <p>Esta sección está lista para extenderse con información detallada.</p>
        </div>
        <div className="admin-empty-state">
          <p>El panel central ofrece un resumen general de {selectedTab === "products" ? "productos" : "envíos"}.</p>
        </div>
      </section>
    );
  }, [loading, orders, products, selectedTab, shippingOrders, stats]);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <BrandMark compact />
          <span>Admin</span>
        </div>
        <nav className="admin-nav" aria-label="Navegación admin">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={selectedTab === item.id ? "admin-nav-item active" : "admin-nav-item"}
              onClick={() => setSelectedTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <div className="admin-header-badge">
              <span>Modo administrador</span>
            </div>
            <p className="eyebrow">Panel administrativo</p>
            <h1>Bienvenido, {user?.email ?? "Administrador"}</h1>
            <p className="admin-subtitle">Gestiona el estado de la tienda y supervisa operaciones clave.</p>
          </div>
          <div className="admin-header-actions">
            <div className="admin-status-card">
              <span>Rol actual</span>
              <strong>{role}</strong>
            </div>
            <button type="button" className="admin-button admin-button-logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        {sectionContent}
      </section>
    </main>
  );
}

export default AdminPage;
