"use client";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Header from "../Header";
import { vi } from "vitest";
import type { Session } from "@supabase/supabase-js";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src = "", alt = "", ...rest }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : ""} alt={alt} {...rest} />
  ),
}));

vi.mock("@/hooks/useSupabaseSession", () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

const mockSupabase = {
  auth: {
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabaseClient", () => {
  return {
    __esModule: true,
    createBrowserSupabaseClient: () => mockSupabase,
  };
});

const mockUseSupabaseSession = vi.mocked(
  await import("@/hooks/useSupabaseSession").then((m) => m.default)
);

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // default mocks for profile fetch
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { user_id: "u1", display_name: "User" },
              error: null,
            }),
        }),
      }),
    });
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it("shows login link when logged out", () => {
    mockUseSupabaseSession.mockReturnValue({ session: null, loading: false });
    render(<Header />);
    expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute("href", "/login");
  });

  it("shows account and password links when logged in", async () => {
    const session: Partial<Session> = {
      user: { id: "u1", email: "user@example.com" } as any,
    };
    mockUseSupabaseSession.mockReturnValue({ session: session as Session, loading: false });
    render(<Header />);
    expect(await screen.findByTitle("アカウント設定へ移動")).toHaveAttribute("href", "/account");
  });

  // logout removed from header
});
