// NotificationContext — polls in-memory notifications every 30s
// Provides: notifications list, unread count, dismiss, dismissAll
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext({
  notifications: [], unread: 0,
  refresh: () => {}, dismiss: () => {}, dismissAll: () => {}
});

// Play a soft beep when new notifications arrive
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window["webkitAudioContext"];
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* browsers may block without user gesture */ }
}

// Request browser notification permission once
function requestBrowserPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("CancerCare 🎗️", { body: message, icon: "/favicon.ico" });
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const prevCountRef = useRef(0);

  const unread = notifications.length;

  const refresh = useCallback(async () => {
    if (!user || user.role !== "patiente") return;
    try {
      const { data } = await api.get("/notifications");
      // Detect new notifications since last poll
      if (data.length > prevCountRef.current) {
        const newOnes = data.slice(0, data.length - prevCountRef.current);
        playBeep();
        newOnes.forEach(n => showBrowserNotification(n.message));
      }
      prevCountRef.current = data.length;
      setNotifications(data);
    } catch { /* silent */ }
  }, [user]);

  const dismiss = useCallback(async id => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        prevCountRef.current = updated.length;
        return updated;
      });
    } catch { /* silent */ }
  }, []);

  const dismissAll = useCallback(async () => {
    try {
      await api.delete("/notifications");
      setNotifications([]);
      prevCountRef.current = 0;
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "patiente") { setNotifications([]); prevCountRef.current = 0; return; }
    requestBrowserPermission();
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  return (
    <NotificationContext.Provider value={{ notifications, unread, refresh, dismiss, dismissAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
