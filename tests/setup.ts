import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Supabase client for unit tests
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) }
  }))
}));
vi.mock("@/lib/db", () => ({ db: {} }));
