// src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { api, isAuthenticated, isAdmin } from '@/utils/api';

interface Notification {
  id: string;
  type: 'new_order' | 'order_ready';
  message: string;
  orderId: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(new Date());

  // Check for new orders (Admin)
  const checkNewOrders = async () => {
    if (!isAdmin()) return;

    try {
      const result = await api.getAllOrders({ status: 'Pending' });
      const pendingOrders = result.orders || [];

      const newOrders = pendingOrders.filter((order: any) => 
        new Date(order.createdAt) > lastChecked
      );

      if (newOrders.length > 0) {
        const newNotifications = newOrders.map((order: any) => ({
          id: `order-${order._id}`,
          type: 'new_order' as const,
          message: `New order ${order.orderId} - ${order.shavedIce.flavor}`,
          orderId: order._id,
          timestamp: new Date(order.createdAt),
          read: false
        }));

        setNotifications(prev => [...newNotifications, ...prev]);
        setUnreadCount(prev => prev + newNotifications.length);

        // Browser notification only (no sound)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🍧 New Bingsu Order!', {
            body: `${newOrders.length} new order(s) received`,
            icon: '/favicon.ico'
          });
        }
      }
    } catch (error) {
      console.error('Failed to check new orders:', error);
    }
  };

  // Check for ready orders (Customer)
  const checkReadyOrders = async () => {
    if (!isAuthenticated() || isAdmin()) return;

    try {
      const result = await api.getMyOrders();
      const myOrders = result.orders || [];

      const readyOrders = myOrders.filter((order: any) => 
        order.status === 'Ready' && new Date(order.createdAt) > lastChecked
      );

      if (readyOrders.length > 0) {
        const newNotifications = readyOrders.map((order: any) => ({
          id: `ready-${order._id}`,
          type: 'order_ready' as const,
          message: `Your order ${order.customerCode} is ready!`,
          orderId: order._id,
          timestamp: new Date(),
          read: false
        }));

        setNotifications(prev => [...newNotifications, ...prev]);
        setUnreadCount(prev => prev + newNotifications.length);

        // Browser notification only (no sound)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎉 Your Bingsu is Ready!', {
            body: 'Come pick up your order!',
            icon: '/favicon.ico'
          });
        }
      }
    } catch (error) {
      console.error('Failed to check ready orders:', error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Mark as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Auto-check every 10 seconds
  useEffect(() => {
    if (!isAuthenticated()) return;

    requestNotificationPermission();

    const interval = setInterval(() => {
      if (isAdmin()) {
        checkNewOrders();
      } else {
        checkReadyOrders();
      }
      setLastChecked(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [lastChecked]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refresh: () => {
      if (isAdmin()) {
        checkNewOrders();
      } else {
        checkReadyOrders();
      }
      setLastChecked(new Date());
    }
  };
}