"use client";

import { useSyncExternalStore } from "react";
import { authStore } from "@/lib/auth";

const subscribe = (callback: () => void) => authStore.subscribe(callback);
const getSnapshot = () => authStore.getSnapshot();
const getServerSnapshot = () => authStore.getSnapshot();

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    ...snapshot,
    login: authStore.login.bind(authStore),
    logout: authStore.logout.bind(authStore),
    register: authStore.register.bind(authStore),
    getTenantId: authStore.getTenantId.bind(authStore),
  };
}
