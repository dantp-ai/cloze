import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

describe("LoginForm", () => {
  it("shows a Create account button in signup mode", () => {
    render(<LoginForm mode="signup" />);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows a Log in button in login mode", () => {
    render(<LoginForm mode="login" />);
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });
});
