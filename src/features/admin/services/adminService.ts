import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { UserRole } from "../../auth/types/auth.types";

export type AdminUserSummary = {
  uid: string;
  email: string;
  role: UserRole;
  createdAt?: unknown;
};

export type AdminOrderSummary = {
  id: string;
  userId: string;
  status: string;
  total: number;
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
};
