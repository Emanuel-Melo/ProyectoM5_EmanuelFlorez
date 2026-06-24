import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { UserRole } from "../../auth/types/auth.types";

export type AdminUserSummary = {
  uid: string;
  email: string;
  role: UserRole;
  createdAt?: unknown;
};

export type AdminProductSummary = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  createdAt?: unknown;
};

export type AdminOrderSummary = {
  id: string;
  userId: string;
  status: string;
  total: number;
  shipping?: string;
  createdAt?: unknown;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalAdmins: number;
  totalProducts: number;
  totalOrders: number;
  statusCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
  };
};

const isUserRole = (value: unknown): value is UserRole =>
  value === "admin" || value === "customer";

export const adminService = {
  async fetchDashboardStats(): Promise<AdminDashboardStats> {
    const [usersSnapshot, productsSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "orders")),
    ]);

    const statusCounts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
    };

    ordersSnapshot.docs.forEach((orderDoc) => {
      const order = orderDoc.data();
      const status = String(order.status ?? "pending");
      if (statusCounts[status as keyof typeof statusCounts] !== undefined) {
        statusCounts[status as keyof typeof statusCounts] += 1;
      }
    });

    const totalAdmins = usersSnapshot.docs.reduce((count, userDoc) => {
      const userData = userDoc.data();
      return count + (isUserRole(userData.role) && userData.role === "admin" ? 1 : 0);
    }, 0);

    return {
      totalUsers: usersSnapshot.size,
      totalAdmins,
      totalProducts: productsSnapshot.size,
      totalOrders: ordersSnapshot.size,
      statusCounts,
    };
  },

  async fetchUsers(): Promise<AdminUserSummary[]> {
    const usersSnapshot = await getDocs(collection(db, "users"));

    return usersSnapshot.docs
      .map((userDoc) => {
        const userData = userDoc.data();

        return {
          uid: userDoc.id,
          email: String(userData.email ?? ""),
          role: isUserRole(userData.role) ? userData.role : "customer",
          createdAt: userData.createdAt,
        };
      })
      .sort((first, second) => first.email.localeCompare(second.email));
  },

  async fetchProducts(): Promise<AdminProductSummary[]> {
    const productsSnapshot = await getDocs(collection(db, "products"));

    return productsSnapshot.docs.map((productDoc) => {
      const productData = productDoc.data();

      return {
        id: productDoc.id,
        name: String(productData.name ?? "Producto sin nombre"),
        category: String(productData.category ?? "otros"),
        price: Number(productData.price ?? 0),
        stock: Number(productData.stock ?? 0),
        active: productData.active === undefined ? true : Boolean(productData.active),
        createdAt: productData.createdAt,
      };
    });
  },

  async fetchRecentOrders(): Promise<AdminOrderSummary[]> {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(6)
    );
    const ordersSnapshot = await getDocs(ordersQuery);

    return ordersSnapshot.docs.map((orderDoc) => {
      const orderData = orderDoc.data();

      return {
        id: orderDoc.id,
        userId: String(orderData.userId ?? ""),
        status: String(orderData.status ?? "pending"),
        total: Number(orderData.total ?? 0),
        shipping: String(orderData.shipping ?? "-"),
        createdAt: orderData.createdAt,
      };
    });
  },

  async fetchShippingOrders(): Promise<AdminOrderSummary[]> {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(8)
    );
    const ordersSnapshot = await getDocs(ordersQuery);

    return ordersSnapshot.docs.map((orderDoc) => {
      const orderData = orderDoc.data();

      return {
        id: orderDoc.id,
        userId: String(orderData.userId ?? ""),
        status: String(orderData.status ?? "pending"),
        total: Number(orderData.total ?? 0),
        shipping: String(orderData.shipping ?? "-"),
        createdAt: orderData.createdAt,
      };
    });
  },

  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    if (!isUserRole(role)) {
      throw new Error("Rol inválido");
    }

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { role });
  },

  onDashboardStatsChange(
    callback: (stats: AdminDashboardStats) => void
  ): Unsubscribe {
    const usersQuery = query(collection(db, "users"));
    const productsQuery = query(collection(db, "products"));
    const ordersQuery = query(collection(db, "orders"));

    let usersSnapshot: AdminUserSummary[] = [];
    let productsSnapshot: AdminProductSummary[] = [];
    let ordersSnapshot: AdminOrderSummary[] = [];
    let unsubscribeCount = 0;

    const updateIfReady = () => {
      if (unsubscribeCount === 3) {
        const statusCounts = {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
        };

        ordersSnapshot.forEach((order) => {
          const status = order.status as keyof typeof statusCounts;
          if (statusCounts[status] !== undefined) {
            statusCounts[status] += 1;
          }
        });

        const totalAdmins = usersSnapshot.reduce(
          (count, user) => count + (user.role === "admin" ? 1 : 0),
          0
        );

        callback({
          totalUsers: usersSnapshot.length,
          totalAdmins,
          totalProducts: productsSnapshot.length,
          totalOrders: ordersSnapshot.length,
          statusCounts,
        });
      }
    };

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      usersSnapshot = snapshot.docs.map((userDoc) => {
        const userData = userDoc.data();
        return {
          uid: userDoc.id,
          email: String(userData.email ?? ""),
          role: isUserRole(userData.role) ? userData.role : ("customer" as UserRole),
          createdAt: userData.createdAt,
        };
      });
      unsubscribeCount = 1;
      updateIfReady();
    });

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      productsSnapshot = snapshot.docs.map((productDoc) => {
        const productData = productDoc.data();
        return {
          id: productDoc.id,
          name: String(productData.name ?? "Producto sin nombre"),
          category: String(productData.category ?? "otros"),
          price: Number(productData.price ?? 0),
          stock: Number(productData.stock ?? 0),
          active:
            productData.active === undefined ? true : Boolean(productData.active),
          createdAt: productData.createdAt,
        };
      });
      unsubscribeCount = 2;
      updateIfReady();
    });

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      ordersSnapshot = snapshot.docs.map((orderDoc) => {
        const orderData = orderDoc.data();
        return {
          id: orderDoc.id,
          userId: String(orderData.userId ?? ""),
          status: String(orderData.status ?? "pending"),
          total: Number(orderData.total ?? 0),
          shipping: String(orderData.shipping ?? "-"),
          createdAt: orderData.createdAt,
        };
      });
      unsubscribeCount = 3;
      updateIfReady();
    });

    return () => {
      unsubscribeUsers();
      unsubscribeProducts();
      unsubscribeOrders();
    };
  },

  onUsersChange(callback: (users: AdminUserSummary[]) => void): Unsubscribe {
    const usersQuery = query(collection(db, "users"));

    return onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs
        .map((userDoc) => {
          const userData = userDoc.data();
          return {
            uid: userDoc.id,
            email: String(userData.email ?? ""),
            role: isUserRole(userData.role) ? userData.role : ("customer" as UserRole),
            createdAt: userData.createdAt,
          };
        })
        .sort((first, second) => first.email.localeCompare(second.email));

      callback(users);
    });
  },

  onProductsChange(callback: (products: AdminProductSummary[]) => void): Unsubscribe {
    const productsQuery = query(collection(db, "products"));

    return onSnapshot(productsQuery, (snapshot) => {
      const products = snapshot.docs.map((productDoc) => {
        const productData = productDoc.data();
        return {
          id: productDoc.id,
          name: String(productData.name ?? "Producto sin nombre"),
          category: String(productData.category ?? "otros"),
          price: Number(productData.price ?? 0),
          stock: Number(productData.stock ?? 0),
          active:
            productData.active === undefined ? true : Boolean(productData.active),
          createdAt: productData.createdAt,
        };
      });

      callback(products);
    });
  },

  onOrdersChange(callback: (orders: AdminOrderSummary[]) => void): Unsubscribe {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(6)
    );

    return onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map((orderDoc) => {
        const orderData = orderDoc.data();
        return {
          id: orderDoc.id,
          userId: String(orderData.userId ?? ""),
          status: String(orderData.status ?? "pending"),
          total: Number(orderData.total ?? 0),
          shipping: String(orderData.shipping ?? "-"),
          createdAt: orderData.createdAt,
        };
      });

      callback(orders);
    });
  },

  onShippingOrdersChange(
    callback: (orders: AdminOrderSummary[]) => void
  ): Unsubscribe {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(8)
    );

    return onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map((orderDoc) => {
        const orderData = orderDoc.data();
        return {
          id: orderDoc.id,
          userId: String(orderData.userId ?? ""),
          status: String(orderData.status ?? "pending"),
          total: Number(orderData.total ?? 0),
          shipping: String(orderData.shipping ?? "-"),
          createdAt: orderData.createdAt,
        };
      });

      callback(orders);
    });
  },
};
