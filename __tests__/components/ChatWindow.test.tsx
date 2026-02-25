import { describe, it, expect, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatWindow from "@/app/components/ChatWindow";
import type { ChatMessage } from "@/lib/types";

describe("ChatWindow", () => {
  it("renders the message input", () => {
    render(<ChatWindow messages={[]} onSend={vi.fn()} disabled={false} isLoading={false} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders the send button", () => {
    render(<ChatWindow messages={[]} onSend={vi.fn()} disabled={false} isLoading={false} />);
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("renders existing messages", async () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ];
    render(
      <ChatWindow messages={messages} onSend={vi.fn()} disabled={false} isLoading={false} />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // Typewriter renders char-by-char; wait for it to complete
    await waitFor(() => expect(screen.getByText(/hi there/i)).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("calls onSend with message text when Send is clicked", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatWindow messages={[]} onSend={onSend} disabled={false} isLoading={false} />);

    await user.type(screen.getByRole("textbox"), "Hello pet");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith("Hello pet");
  });

  it("clears input after sending", async () => {
    const user = userEvent.setup();
    render(
      <ChatWindow messages={[]} onSend={vi.fn()} disabled={false} isLoading={false} />
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "test message");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("submits on Enter key", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatWindow messages={[]} onSend={onSend} disabled={false} isLoading={false} />);

    await user.type(screen.getByRole("textbox"), "Hi{Enter}");
    expect(onSend).toHaveBeenCalledWith("Hi");
  });

  it("does not submit empty message", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatWindow messages={[]} onSend={onSend} disabled={false} isLoading={false} />);
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input and button when disabled is true", () => {
    render(<ChatWindow messages={[]} onSend={vi.fn()} disabled={true} isLoading={false} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("disables input and button when isLoading is true", () => {
    render(<ChatWindow messages={[]} onSend={vi.fn()} disabled={false} isLoading={true} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("shows input placeholder 'thinking...' when isLoading", () => {
    render(<ChatWindow messages={[]} onSend={vi.fn()} disabled={false} isLoading={true} />);
    expect(screen.getByPlaceholderText(/thinking/i)).toBeInTheDocument();
  });
});
