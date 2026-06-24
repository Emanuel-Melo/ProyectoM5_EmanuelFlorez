import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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
  OrderStatus,
} from "../services/adminService";
import type { UserRole } from "../../auth/types/auth.types";
import type { UploadInfo } from "../../../shared/types/s3.types";
import "./AdminPage.css";

const navItems = [
  { id: "dashboard", label: "Estadísticas" },
  { id: "users", label: "Usuarios" },
  { id: "products", label: "Productos" },
  { id: "orders", label: "Pedidos" },
  { id: "shipping", label: "Envíos" },
];

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  canceled: "Cancelado",
};

const orderStatuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "canceled"];

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
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: productCategories[0],
    price: "",
    stock: "",
    imageUrl: "",
    imageFile: null as File | null,
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
    value: string | boolean | File | null
  ) => {
    setNewProduct((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setNewProduct((current) => ({
      ...current,
      imageFile: file,
    }));
  };

  const uploadProductImage = async (): Promise<string> => {
    if (newProduct.imageFile) {
      setIsUploadingImage(true);
      try {
        const { requestS3UploadUrl } = await import(
          "../../../shared/services/s3Service"
        );

        const uploadInfo: UploadInfo = await requestS3UploadUrl(
          newProduct.imageFile.name,
          newProduct.imageFile.type || "application/octet-stream"
        );

        console.log("[admin] uploadInfo:", uploadInfo);
        const uploadResponse = await fetch(uploadInfo.uploadUrl, {
          method: "PUT",
          mode: "cors",
          headers: {
            "Content-Type": newProduct.imageFile.type || "application/octet-stream",
          },
          body: newProduct.imageFile,
        });

        console.log("[admin] S3 PUT status", uploadResponse.status, uploadResponse.statusText);
        if (!uploadResponse.ok) {
          const bodyText = await uploadResponse.text().catch(() => "<no-body>");
          console.error("[admin] S3 upload failed:", uploadResponse.status, bodyText);
          throw new Error(`La carga a S3 falló. Código ${uploadResponse.status} ${uploadResponse.statusText}. ${bodyText}`);
        }

        setNewProduct((current) => ({
          ...current,
          imageUrl: uploadInfo.publicUrl,
        }));

        return uploadInfo.publicUrl;
      } finally {
        setIsUploadingImage(false);
      }
    }

    return newProduct.imageUrl.trim();
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProduct({
      name: "",
      description: "",
      category: productCategories[0],
      price: "",
      stock: "",
      imageUrl: "",
      imageFile: null,
      active: true,
    });
  };

  const handleEditProduct = (product: AdminProductSummary) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl,
      imageFile: null,
      active: product.active,
    });
    setSelectedTab("products");
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSavingProduct(true);

    try {
      await adminService.deleteProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setStatusMessage("Producto eliminado correctamente.");
      setStats((prev) =>
        prev
          ? { ...prev, totalProducts: Math.max(prev.totalProducts - 1, 0) }
          : prev
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo eliminar el producto. Intenta nuevamente.");
    } finally {
      setIsSavingProduct(false);
      window.setTimeout(() => setStatusMessage(null), 4500);
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    setUpdatingOrderId(orderId);
    setStatusMessage(null);
    setErrorMessage(null);

    const currentOrder = orders.find((order) => order.id === orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      setShippingOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      setStats((prev) => {
        if (!prev || !currentOrder) return prev;

        const statusCounts = { ...prev.statusCounts };
        if (statusCounts[currentOrder.status] !== undefined) {
          statusCounts[currentOrder.status] = Math.max(
            statusCounts[currentOrder.status] - 1,
            0
          );
        }
        if (statusCounts[newStatus] !== undefined) {
          statusCounts[newStatus] += 1;
        }

        return { ...prev, statusCounts };
      });

      setStatusMessage(`Pedido ${orderId} actualizado a ${statusLabels[newStatus]}.`);
      window.setTimeout(() => setStatusMessage(null), 4500);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo actualizar el estado del pedido. Intenta nuevamente.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveProduct = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSavingProduct(true);

    if (!newProduct.name.trim() || !newProduct.description.trim() || (!newProduct.imageUrl.trim() && !newProduct.imageFile)) {
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
      const uploadedImageUrl = await uploadProductImage();

      if (!uploadedImageUrl) {
        throw new Error("La imagen no se pudo obtener correctamente.");
      }

      const productPayload = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        category: newProduct.category,
        price: priceValue,
        stock: stockValue,
        imageUrl: uploadedImageUrl,
        active: Boolean(newProduct.active),
      };

      if (editingProductId) {
        const updatedProduct = await adminService.updateProduct(editingProductId, productPayload);
        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProductId ? updatedProduct : product
          )
        );
        setStatusMessage(`Producto "${updatedProduct.name}" actualizado correctamente.`);
      } else {
        const createdProduct = await adminService.createProduct(productPayload);
        setProducts((prev) => [createdProduct, ...prev]);
        setStats((prev) =>
          prev
            ? { ...prev, totalProducts: prev.totalProducts + 1 }
            : prev
        );
        setStatusMessage(`Producto "${createdProduct.name}" creado correctamente.`);
      }

      resetProductForm();
    } catch (error) {
      console.error(error);
      const errorMessageText =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "No se pudo guardar el producto. Intenta nuevamente.";
      setErrorMessage(`No se pudo guardar el producto. ${errorMessageText}`);
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
          <article className="dashboard-card stat-card">
            <strong>{stats?.statusCounts.canceled ?? 0}</strong>
            <span>Pedidos cancelados</span>
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
                        <div className="admin-role-select-wrapper">
                          <select
                            className="admin-role-select"
                            value={account.role}
                            disabled={isCurrentAdmin || isSaving}
                            aria-label={`Rol de ${account.email}`}
                            onChange={(event) =>
                              handleRoleChange(
                                account.uid,
                                event.target.value as UserRole,
                                account.email
                              )
                            }
                          >
                            <option value="customer">Cliente</option>
                            <option value="admin">Administrador</option>
                          </select>
                          <span className={`admin-role-badge ${account.role}`}>
                            {account.role === "admin" ? "Admin" : "Cliente"}
                          </span>
                        </div>
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
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Zapatos deportivos"
                />
              </label>
              <label className="admin-product-field">
                <span>Categoría</span>
                <select
                  value={newProduct.category}
                  onChange={(event) => handleNewProductChange("category", event.target.value)}
                  aria-label="Categoría del producto"
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newProduct.price}
                  onChange={(event) => {
                    const cleaned = String(event.target.value).replace(/\D+/g, "");
                    handleNewProductChange("price", cleaned);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="120000"
                />
                <small className="admin-form-hint">Sólo números (sin decimales)</small>
              </label>
              <label className="admin-product-field">
                <span>Stock</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newProduct.stock}
                  onChange={(event) => {
                    const cleaned = String(event.target.value).replace(/\D+/g, "");
                    handleNewProductChange("stock", cleaned);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="20"
                />
                <small className="admin-form-hint">Sólo números (cantidad entera)</small>
              </label>
              <label className="admin-product-field">
                <span>Imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <small className="admin-form-hint">Puedes subir un archivo para cargarlo a S3.</small>
              </label>
              <label className="admin-product-field admin-product-field-full">
                <span>URL de imagen</span>
                <input
                  type="text"
                  value={newProduct.imageUrl}
                  onChange={(event) => handleNewProductChange("imageUrl", event.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="https://..."
                />
              </label>
              {newProduct.imageUrl ? (
                <div className="admin-image-preview admin-product-field admin-product-field-full">
                  <span>Vista previa</span>
                  <img src={newProduct.imageUrl} alt="Previsualización" />
                </div>
              ) : null}
              <label className="admin-product-field admin-product-field-full">
                <span>Descripción</span>
                <textarea
                  value={newProduct.description}
                  onChange={(event) => handleNewProductChange("description", event.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Descripción del producto"
                />
              </label>
            </div>
            <div className="admin-product-actions">
              {statusMessage ? <div className="admin-feedback success">{statusMessage}</div> : null}
              {errorMessage ? <div className="admin-feedback error">{errorMessage}</div> : null}
              <button
                type="button"
                className="admin-button admin-button-primary"
                onClick={handleSaveProduct}
                disabled={isSavingProduct || isUploadingImage}
              >
                {isUploadingImage
                  ? "Subiendo imagen..."
                  : isSavingProduct
                  ? editingProductId
                    ? "Actualizando producto..."
                    : "Guardando producto..."
                  : editingProductId
                  ? "Actualizar producto"
                  : "Guardar producto"}
              </button>
              {editingProductId ? (
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={resetProductForm}
                  disabled={isSavingProduct || isUploadingImage}
                >
                  Cancelar edición
                </button>
              ) : null}
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
                    <td>
                      <div className="admin-action-buttons">
                        <button
                          type="button"
                          className="admin-button admin-button-secondary"
                          onClick={() => handleEditProduct(product)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="admin-button admin-button-danger"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={isSavingProduct}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
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
                    <td>
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          handleOrderStatusChange(
                            order.id,
                            event.target.value as OrderStatus
                          )
                        }
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
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
                    <td>
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          handleOrderStatusChange(
                            order.id,
                            event.target.value as OrderStatus
                          )
                        }
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
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
  }, [
    loading,
    orders,
    products,
    selectedTab,
    shippingOrders,
    stats,
    newProduct,
    statusMessage,
    errorMessage,
    isUploadingImage,
    isSavingProduct,
  ]);

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
