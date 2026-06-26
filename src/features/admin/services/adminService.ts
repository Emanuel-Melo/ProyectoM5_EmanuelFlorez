import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  active: boolean;
  createdAt?: unknown;
};

export type AdminProductPayload = {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  active: boolean;
};

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";

export type AdminOrderSummary = {
  id: string;
  userId: string;
  status: OrderStatus;
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
    canceled: number;
  };
};

const isUserRole = (value: unknown): value is UserRole =>
  value === "admin" || value === "customer";

const isOrderStatus = (value: unknown): value is OrderStatus =>
  value === "pending" ||
  value === "processing" ||
  value === "shipped" ||
  value === "delivered" ||
  value === "canceled";

const parseOrderStatus = (value: unknown): OrderStatus =>
  isOrderStatus(value) ? value : "pending";


//Obtiene datos como usuarios, productos, pedidos, todos simultaneamente y los devuelve en un objeto con las estadísticas del panel de administración
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
      canceled: 0,
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


  //Obtiene todos los usuarios de la base de datos y los devuelve en un array de objetos con la información resumida de cada usuario
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



  //Esta funcion es para traer los productos de la base de datos y leerlos
  async fetchProducts(): Promise<AdminProductSummary[]> {
    const productsSnapshot = await getDocs(collection(db, "products"));

    return productsSnapshot.docs.map((productDoc) => {
      const productData = productDoc.data();

      return {
        id: productDoc.id,
        name: String(productData.name ?? "Producto sin nombre"),
        description: String(productData.description ?? ""),
        category: String(productData.category ?? "otros"),
        price: Number(productData.price ?? 0),
        stock: Number(productData.stock ?? 0),
        imageUrl: String(productData.imageUrl ?? ""),
        active: productData.active === undefined ? true : Boolean(productData.active),
        createdAt: productData.createdAt,
      };
    });
  },


  //Esta funcion es para crear productos nuevos en base de datos
  async createProduct(productData: AdminProductPayload): Promise<AdminProductSummary> {
    const productsCollection = collection(db, "products");
    const newProductRef = await addDoc(productsCollection, {
      name: String(productData.name),
      description: String(productData.description),
      category: String(productData.category),
      price: Number(productData.price),
      stock: Number(productData.stock),
      imageUrl: String(productData.imageUrl),
      active: Boolean(productData.active),
      createdAt: serverTimestamp(),
    });

    return {
      id: newProductRef.id,
      name: String(productData.name),
      description: String(productData.description),
      category: String(productData.category),
      price: Number(productData.price),
      stock: Number(productData.stock),
      imageUrl: String(productData.imageUrl),
      active: Boolean(productData.active),
      createdAt: null,
    };
  },



  //Es para actualizar modificando los campos necesarios
  async updateProduct(
    productId: string,
    productData: AdminProductPayload
  ): Promise<AdminProductSummary> {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      name: String(productData.name),
      description: String(productData.description),
      category: String(productData.category),
      price: Number(productData.price),
      stock: Number(productData.stock),
      imageUrl: String(productData.imageUrl),
      active: Boolean(productData.active),
    });

    return {
      id: productId,
      name: String(productData.name),
      description: String(productData.description),
      category: String(productData.category),
      price: Number(productData.price),
      stock: Number(productData.stock),
      imageUrl: String(productData.imageUrl),
      active: Boolean(productData.active),
      createdAt: null,
    };
  },


  //Como su nombre lo indica, elmina productos de la base de datos
  async deleteProduct(productId: string): Promise<void> {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: String(status),
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
        status: parseOrderStatus(orderData.status),
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
        status: parseOrderStatus(orderData.status),
        total: Number(orderData.total ?? 0),
        shipping: String(orderData.shipping ?? "-"),
        createdAt: orderData.createdAt,
      };
    });
  },


  //cambia rol del usuario
  async updateUserRole(
    uid: string,
    role: UserRole,
    performedBy: { uid: string; email: string; targetEmail: string }
  ): Promise<void> {
    if (!isUserRole(role)) {
      throw new Error("Rol inválido");
    }

    const userRef = doc(db, "users", uid);
    const adminRef = doc(db, "users", performedBy.uid);

    const targetMessage =
      role === "admin"
        ? `¡Felicidades! Tu rol ha sido actualizado a ADMIN por ${performedBy.email}.`
        : `Tu rol ha sido actualizado a CLIENTE por ${performedBy.email}.`;

    const adminMessage =
      role === "admin"
        ? `Has asignado rol ADMIN al usuario ${performedBy.targetEmail}.`
        : `Has revertido a CLIENTE al usuario ${performedBy.targetEmail}.`;

    await Promise.all([
      updateDoc(userRef, {
        role,
        pendingNotification: targetMessage,
      }),
      updateDoc(adminRef, {
        pendingNotification: adminMessage,
      }),
    ]);
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
          canceled: 0,
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
          description: String(productData.description ?? ""),
          category: String(productData.category ?? "otros"),
          price: Number(productData.price ?? 0),
          stock: Number(productData.stock ?? 0),
          imageUrl: String(productData.imageUrl ?? ""),
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
          status: parseOrderStatus(orderData.status),
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
          description: String(productData.description ?? ""),
          category: String(productData.category ?? "otros"),
          price: Number(productData.price ?? 0),
          stock: Number(productData.stock ?? 0),
          imageUrl: String(productData.imageUrl ?? ""),
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
          status: parseOrderStatus(orderData.status),
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
          status: parseOrderStatus(orderData.status),
          total: Number(orderData.total ?? 0),
          shipping: String(orderData.shipping ?? "-"),
          createdAt: orderData.createdAt,
        };
      });

      callback(orders);
    });
  },
};
