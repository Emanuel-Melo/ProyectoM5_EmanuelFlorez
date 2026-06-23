import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BrandMark } from "../../../shared/components/BrandMark";
import { authService } from "../../auth/services/authService";
import { useAuth } from "../../auth/hooks/useAuth";
import { adminService } from "../services/adminService";
import type { AdminDashboardStats, AdminOrderSummary } from "../services/adminService";
import "./AdminPage.css";

const navItems = [
  { id: "dashboard", label: "Estadísticas" },
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

function AdminPage() {
  const { user, role } = useAuth();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [dashboardStats, userList, recentOrders] = await Promise.all([
          adminService.fetchDashboardStats(),
          adminService.fetchUsers(),
          adminService.fetchRecentOrders(),
        ]);

        setStats(dashboardStats);
        setUsers(userList);
        setOrders(recentOrders);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadAdminData();
  }, []);

  const canManageUsers = role === "admin";

  const handleRoleChange = async (uid: string, newRole: "admin" | "customer") => {
    if (!canManageUsers) return;

    setActionLoading(true);
    try {
      await adminService.updateUserRole(uid, newRole);
      setUsers((prev) => prev.map((item) => (item.uid === uid ? { ...item, role: newRole } : item)));
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el rol del usuario.");
    } finally {
      setActionLoading(false);
    }
  };

  const userCount = stats?.totalUsers ?? 0;
  const adminCount = stats?.totalAdmins ?? 0;
  const productCount = stats?.totalProducts ?? 0;
  const orderCount = stats?.totalOrders ?? 0;

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
            <p>Designa administradores desde el panel de control.</p>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.uid}>
                    <td>{userItem.email}</td>
                    <td>{userItem.role}</td>
                    <td>{new Date(
                      typeof userItem.createdAt === "object" && userItem.createdAt !== null && "seconds" in userItem.createdAt
                        ? (userItem.createdAt as { seconds: number }).seconds * 1000
                        : Date.now()
                    ).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={!canManageUsers || actionLoading || userItem.role === "admin"}
                        onClick={() => handleRoleChange(userItem.uid, "admin")}
                      >
                        Hacer admin
                      </button>
                    </td>
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
  }, [loading, orders, selectedTab, stats, users, canManageUsers, actionLoading]);

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
            <p className="eyebrow">Panel administrativo</p>
            <h1>Bienvenido, {user?.email ?? "Administrador"}</h1>
            <p className="admin-subtitle">Gestiona el estado de la tienda y la administración de usuarios en un solo lugar.</p>
          </div>
          <div className="admin-status-card">
            <span>Rol actual</span>
            <strong>{role}</strong>
          </div>
        </header>

        {sectionContent}
      </section>
    </main>
  );
}

export default AdminPage;
