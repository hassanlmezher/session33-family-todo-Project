import { create } from "zustand";
import { buildUrl, authHeaders } from "./config";

export type Family = { id: number; name: string };
export type FamilyMember = { id: number; email: string; full_name?: string | null };
export type PotentialMember = { id: number; email: string };
export type Invite = { token: string; family_name: string };
export type Todo = {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  assignee_id?: number;
  assignee_email?: string;
  completed: boolean;
  created_at?: string;
};

type ViewMode = "list" | "cards";
type ThemeMode = "light" | "dark";

type Store = {
  // ui
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;

  // auth / user
  user: { id: number } | null;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, familyName: string) => Promise<void>;
  join: (inviteToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // data
  family: Family | null;
  familyMembers: FamilyMember[];
  potentialMembers: PotentialMember[];
  invites: Invite[];
  todos: Todo[];

  // filters
  searchText: string;
  setSearchText: (s: string) => void;
  filterAssignee: string;
  setFilterAssignee: (s: string) => void;
  filterCompleted: "" | "completed" | "pending";
  setFilterCompleted: (s: "" | "completed" | "pending") => void;
  clearFilters: () => void;

  // actions
  fetchFamily: () => Promise<void>;
  fetchFamilyMembers: () => Promise<void>;
  searchUsers: () => Promise<void>;
  inviteMember: (userId: number) => Promise<{ token?: string; error?: string }>;
  fetchInvites: () => Promise<Invite[]>;
  fetchTodos: () => Promise<void>;
  createTodo: (payload: Partial<Todo>) => Promise<{ id?: number; error?: string }>;
  updateTodoApi: (id: number, updates: Partial<Todo>) => Promise<{ ok: boolean; error?: string }>;
  toggleTodoComplete: (id: number) => Promise<void>;
  deleteTodoApi: (id: number) => Promise<void>;
};

export const useStore = create<Store>((set, get) => ({
  // ui
  theme: (localStorage.getItem("theme") as ThemeMode) || "light",
  setTheme: (t) => {
    localStorage.setItem("theme", t);
    set({ theme: t });
  },
  view: "cards",
  setView: (v) => set({ view: v }),

  // auth
  user: null,
  error: null,
  clearError: () => set({ error: null }),

  async login(email, password) {
    set({ error: null });
    const res = await fetch(buildUrl("/auth/login"), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      set({ error: data.error || "Login failed" });
      return;
    }
    localStorage.setItem("token", data.token);
    // JWT payload has { uid, fid, email }
    try {
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      set({ user: { id: payload.uid } });
    } catch {
      set({ user: { id: 0 } });
    }
  },

  async signup(email, password, familyName) {
    set({ error: null });
    const res = await fetch(buildUrl("/auth/signup"), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email, password, family_name: familyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      set({ error: data.error || "Signup failed" });
      throw new Error(data.error || "Signup failed");
    }
    localStorage.setItem("token", data.token);
    try {
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      set({ user: { id: payload.uid } });
    } catch {
      set({ user: { id: 0 } });
    }
  },

  async join(inviteToken) {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl("/invites/join"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ token: inviteToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      set({ error: data.error || "Join failed" });
      return { success: false, error: data.error };
    }
    return { success: true };
  },

  logout() {
    localStorage.removeItem("token");
    set({
      user: null,
      family: null,
      familyMembers: [],
      potentialMembers: [],
      invites: [],
      todos: [],
    });
  },

  // data
  family: null,
  familyMembers: [],
  potentialMembers: [],
  invites: [],
  todos: [],

  // filters
  searchText: "",
  setSearchText: (s) => set({ searchText: s }),
  filterAssignee: "",
  setFilterAssignee: (s) => set({ filterAssignee: s }),
  filterCompleted: "",
  setFilterCompleted: (s) => set({ filterCompleted: s }),
  clearFilters: () => set({ searchText: "", filterAssignee: "", filterCompleted: "" }),

  async fetchFamily() {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl("/family"), { headers: authHeaders(token) });
    if (!res.ok) return;
    const data = await res.json();
    set({ family: data });
  },

  async fetchFamilyMembers() {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl("/family/members"), { headers: authHeaders(token) });
    if (!res.ok) return;
    const data = await res.json();
    set({ familyMembers: data });
  },

  async searchUsers() {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl("/users/search"), { headers: authHeaders(token) });
    if (!res.ok) return;
    const data = await res.json();
    set({ potentialMembers: data });
  },

  async inviteMember(userId: number) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(buildUrl("/family/invite"), {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Failed to invite" };
      // some backends return { token }
      return { token: data.token as string | undefined };
    } catch (e: any) {
      return { error: e?.message || "Network error" };
    }
  },

  async fetchInvites() {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl("/invites"), { headers: authHeaders(token) });
    const data = await res.json();
    if (res.ok) set({ invites: data });
    return data;
  },

  async fetchTodos() {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl("/todos"), { headers: authHeaders(token) });
    if (!res.ok) return;
    const data = await res.json();
    set({ todos: data });
  },

  async createTodo(payload) {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl("/todos"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to create task" };
    set({ todos: [data, ...get().todos] });
    return { id: data.id as number };
  },

  async updateTodoApi(id, updates) {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl(`/todos/${id}`), {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Update failed" };
    set({
      todos: get().todos.map((t) => (t.id === id ? data : t)),
    });
    return { ok: true };
  },

  async toggleTodoComplete(id) {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl(`/todos/${id}`), {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ completed: true }),
    });
    const data = await res.json();
    if (!res.ok) return;
    set({
      todos: get().todos.map((t) => (t.id === id ? data : t)),
    });
  },

  async deleteTodoApi(id) {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(buildUrl(`/todos/${id}`), {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) return;
    set({ todos: get().todos.filter((t) => t.id !== id) });
  },
}));

export default useStore;
