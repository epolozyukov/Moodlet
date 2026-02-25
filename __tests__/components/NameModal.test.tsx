import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NameModal from "@/app/components/NameModal";

describe("NameModal", () => {
  it("renders the name input", () => {
    render(<NameModal onSubmit={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    render(<NameModal onSubmit={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onSubmit with trimmed name when valid name is entered", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NameModal onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), "  Bubbles  ");
    await user.click(screen.getByRole("button"));

    expect(onSubmit).toHaveBeenCalledWith("Bubbles");
  });

  it("does not call onSubmit when name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NameModal onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when name exceeds 20 characters", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NameModal onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), "A".repeat(21));
    await user.click(screen.getByRole("button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts exactly 20 characters", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NameModal onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), "A".repeat(20));
    await user.click(screen.getByRole("button"));
    expect(onSubmit).toHaveBeenCalledWith("A".repeat(20));
  });

  it("shows an error message when name is empty and submit is attempted", async () => {
    const user = userEvent.setup();
    render(<NameModal onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("submits on Enter key", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NameModal onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), "Pixel{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Pixel");
  });
});
