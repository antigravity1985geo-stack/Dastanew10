import { supabase } from "./supabase";

export interface User {
  id: string;
  username: string;
  displayName: string;
  password: string; // In production, use hashing. This is placeholder for Supabase migration.
  createdAt: string;
}

type AuthListener = () => void;

export interface AuthSnapshot {
  currentUser: Omit<User, "password"> | null;
  isAuthenticated: boolean;
  users: Omit<User, "password">[];
}

const SESSION_KEY = "warehouse_auth_session";

class AuthStore {
  private users: User[] = [];
  private currentUserId: string | null = null;
  private listeners: Set<AuthListener> = new Set();
  private _cachedSnapshot: AuthSnapshot | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (typeof window === "undefined") return;

    try {
      const { data: usersData, error } = await supabase.from('users').select('*');

      if (error) {
        console.error("Error fetching users:", error.message, error.details, error.hint);
      }

      if (usersData && usersData.length > 0) {
        this.users = usersData.map((u: any) => ({
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          password: u.password,
          createdAt: u.created_at
        }));
      } else {
        this.users = [];
      }

      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.userId && this.users.find((u) => u.id === parsed.userId)) {
          this.currentUserId = parsed.userId;
        }
      }

      this.notify();

      // Realtime users
      supabase
        .channel('auth-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          this.handleRealtimeUser(payload);
        })
        .subscribe();

    } catch (err) {
      console.error("Auth init error:", err);
    }
  }

  private handleRealtimeUser(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;

    const mapUser = (u: any) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      password: u.password,
      createdAt: u.created_at
    });

    if (eventType === 'INSERT') {
      if (!this.users.find(u => u.id === newRow.id)) {
        this.users.push(mapUser(newRow));
      }
    } else if (eventType === 'UPDATE') {
      const idx = this.users.findIndex(u => u.id === newRow.id);
      if (idx !== -1) this.users[idx] = mapUser(newRow);
    } else if (eventType === 'DELETE') {
      this.users = this.users.filter(u => u.id !== oldRow.id);
      if (this.currentUserId === oldRow.id) {
        this.logout();
      }
    }
    this.notify();
  }

  private invalidateSnapshot() {
    this._cachedSnapshot = null;
  }

  private notify() {
    this.invalidateSnapshot();
    this.listeners.forEach((l) => l());
  }


  private persistSession() {
    if (typeof window !== "undefined") {
      if (this.currentUserId) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: this.currentUserId }));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }

  private sanitizeUser(user: User): Omit<User, "password"> {
    const { password: _, ...rest } = user;
    return rest;
  }

  getSnapshot(): AuthSnapshot {
    if (!this._cachedSnapshot) {
      const currentUser = this.currentUserId
        ? this.users.find((u) => u.id === this.currentUserId)
        : null;
      this._cachedSnapshot = {
        currentUser: currentUser ? this.sanitizeUser(currentUser) : null,
        isAuthenticated: !!currentUser,
        users: this.users.map((u) => this.sanitizeUser(u)),
      };
    }
    return this._cachedSnapshot;
  }

  subscribe(listener: AuthListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    const user = this.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!user) {
      return { success: false, error: "მომხმარებელი ვერ მოიძებნა" };
    }
    if (user.password !== password) {
      return { success: false, error: "პაროლი არასწორია" };
    }
    this.currentUserId = user.id;
    this.persistSession();
    this.notify();
    return { success: true };
  }

  logout() {
    this.currentUserId = null;
    this.persistSession();
    this.notify();
  }

  async addUser(username: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
    if (this.users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: "ეს მომხმარებლის სახელი უკვე არსებობს" };
    }
    if (username.length < 3) {
      return { success: false, error: "მომხმარებლის სახელი მინიმუმ 3 სიმბოლო უნდა იყოს" };
    }
    if (password.length < 4) {
      return { success: false, error: "პაროლი მინიმუმ 4 სიმბოლო უნდა იყოს" };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      password,
      displayName: displayName || username,
      createdAt: new Date().toISOString(),
    };

    // Optimistic
    this.users.push(newUser);
    this.notify();

    const { error } = await supabase.from('users').insert({
      id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      display_name: newUser.displayName,
      created_at: newUser.createdAt
    });
    if (error) {
      console.error("Error adding user:", error);
      this.users = this.users.filter(u => u.id !== newUser.id);
      this.notify();
      return { success: false, error: "შეცდომა ბაზაში შენახვისას" };
    }

    return { success: true };
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    if (userId === this.currentUserId) {
      return { success: false, error: "საკუთარი თავის წაშლა არ შეიძლება" };
    }
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: "მომხმარებელი ვერ მოიძებნა" };
    }

    const oldUsers = [...this.users];
    // Optimistic
    this.users = this.users.filter((u) => u.id !== userId);
    this.notify();

    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.error("Error deleting user:", error);
      this.users = oldUsers;
      this.notify();
      return { success: false, error: "შეცდომა წაშლისას" };
    }

    return { success: true };
  }

  async updateUser(
    userId: string,
    data: { displayName?: string; password?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: "მომხმარებელი ვერ მოიძებნა" };
    }

    const oldUser = { ...user };
    if (data.displayName) user.displayName = data.displayName;
    if (data.password) {
      if (data.password.length < 4) {
        return { success: false, error: "პაროლი მინიმუმ 4 სიმბოლო უნდა იყოს" };
      }
      user.password = data.password;
    }

    // Optimistic
    this.notify();

    // Map to snake_case
    const dbUpdates: any = {};
    if (data.displayName) dbUpdates.display_name = data.displayName;
    if (data.password) dbUpdates.password = data.password;

    const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);
    if (error) {
      console.error("Error updating user:", error);
      Object.assign(user, oldUser);
      this.notify();
      return { success: false, error: "შეცდომა ბაზაში განახლებისას" };
    }

    return { success: true };
  }

  getAllUsersRaw(): User[] {
    return [...this.users];
  }

  async importUsers(users: User[]) {
    this.users = users;
    this.notify();

    const dbUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      display_name: u.displayName,
      password: u.password,
      created_at: u.createdAt
    }));

    await supabase.from('users').upsert(dbUsers);
  }
}

let _authInstance: AuthStore | null = null;
function getAuthStore(): AuthStore {
  if (!_authInstance) {
    _authInstance = new AuthStore();
  }
  return _authInstance;
}

export const authStore =
  typeof window !== "undefined" ? getAuthStore() : new AuthStore();
