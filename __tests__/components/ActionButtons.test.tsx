import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionButtons from "@/app/components/ActionButtons";

const defaultProps = {
  onFeed: vi.fn(),
  onClean: vi.fn(),
  onSleep: vi.fn(),
  onChat: vi.fn(),
  isSleeping: false,
  isSick: false,
  isAILoading: false,
};

describe("ActionButtons", () => {
  it("renders Feed, Clean, Sleep, and Chat buttons", () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByRole("button", { name: /feed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clean/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sleep/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chat/i })).toBeInTheDocument();
  });

  it("calls onFeed when Feed is clicked", async () => {
    const user = userEvent.setup();
    const onFeed = vi.fn();
    render(<ActionButtons {...defaultProps} onFeed={onFeed} />);
    await user.click(screen.getByRole("button", { name: /feed/i }));
    expect(onFeed).toHaveBeenCalledTimes(1);
  });

  it("calls onClean when Clean is clicked", async () => {
    const user = userEvent.setup();
    const onClean = vi.fn();
    render(<ActionButtons {...defaultProps} onClean={onClean} />);
    await user.click(screen.getByRole("button", { name: /clean/i }));
    expect(onClean).toHaveBeenCalledTimes(1);
  });

  it("calls onSleep when Sleep is clicked", async () => {
    const user = userEvent.setup();
    const onSleep = vi.fn();
    render(<ActionButtons {...defaultProps} onSleep={onSleep} />);
    await user.click(screen.getByRole("button", { name: /sleep/i }));
    expect(onSleep).toHaveBeenCalledTimes(1);
  });

  it("calls onChat when Chat is clicked", async () => {
    const user = userEvent.setup();
    const onChat = vi.fn();
    render(<ActionButtons {...defaultProps} onChat={onChat} />);
    await user.click(screen.getByRole("button", { name: /chat/i }));
    expect(onChat).toHaveBeenCalledTimes(1);
  });

  it("disables all buttons when isSleeping is true", () => {
    render(<ActionButtons {...defaultProps} isSleeping={true} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("shows 'Sleeping...' on Sleep button when isSleeping", () => {
    render(<ActionButtons {...defaultProps} isSleeping={true} />);
    expect(screen.getByRole("button", { name: /sleeping/i })).toBeInTheDocument();
  });

  it("disables Chat button when isSick is true", () => {
    render(<ActionButtons {...defaultProps} isSick={true} />);
    expect(screen.getByRole("button", { name: /chat/i })).toBeDisabled();
  });

  it("does not disable Feed/Clean/Sleep when only isSick is true", () => {
    render(<ActionButtons {...defaultProps} isSick={true} />);
    expect(screen.getByRole("button", { name: /feed/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /clean/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /sleep/i })).not.toBeDisabled();
  });

  it("disables Chat button when isAILoading is true", () => {
    render(<ActionButtons {...defaultProps} isAILoading={true} />);
    expect(screen.getByRole("button", { name: /chat/i })).toBeDisabled();
  });
});
