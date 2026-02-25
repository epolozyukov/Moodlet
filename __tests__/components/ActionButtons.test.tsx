import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionButtons from "@/app/components/ActionButtons";

const defaultProps = {
  onMeal: vi.fn(),
  onSnack: vi.fn(),
  onPlay: vi.fn(),
  onClean: vi.fn(),
  onSleep: vi.fn(),
  onWake: vi.fn(),
  onMedicine: vi.fn(),
  onChat: vi.fn(),
  isSleeping: false,
  isSick: false,
  isAILoading: false,
  energy: 80,
};

describe("ActionButtons (awake, healthy)", () => {
  it("renders Meal, Snack, Play, Clean, Sleep, Chat buttons", () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByRole("button", { name: /meal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /snack/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clean/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sleep/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chat/i })).toBeInTheDocument();
  });

  it("calls onMeal when Meal is clicked", async () => {
    const user = userEvent.setup();
    const onMeal = vi.fn();
    render(<ActionButtons {...defaultProps} onMeal={onMeal} />);
    await user.click(screen.getByRole("button", { name: /meal/i }));
    expect(onMeal).toHaveBeenCalledTimes(1);
  });

  it("calls onSnack when Snack is clicked", async () => {
    const user = userEvent.setup();
    const onSnack = vi.fn();
    render(<ActionButtons {...defaultProps} onSnack={onSnack} />);
    await user.click(screen.getByRole("button", { name: /snack/i }));
    expect(onSnack).toHaveBeenCalledTimes(1);
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

  it("does not show Medicine button when not sick", () => {
    render(<ActionButtons {...defaultProps} isSick={false} />);
    expect(screen.queryByRole("button", { name: /medicine/i })).not.toBeInTheDocument();
  });

  it("disables Play button when energy is 20 or below", () => {
    render(<ActionButtons {...defaultProps} energy={20} />);
    expect(screen.getByRole("button", { name: /play/i })).toBeDisabled();
  });

  it("enables Play button when energy is above 20", () => {
    render(<ActionButtons {...defaultProps} energy={21} />);
    expect(screen.getByRole("button", { name: /play/i })).not.toBeDisabled();
  });

  it("disables Chat button when isAILoading is true", () => {
    render(<ActionButtons {...defaultProps} isAILoading={true} />);
    expect(screen.getByRole("button", { name: /chat/i })).toBeDisabled();
  });
});

describe("ActionButtons (sleeping)", () => {
  it("shows only Wake Up button when isSleeping is true", () => {
    render(<ActionButtons {...defaultProps} isSleeping={true} />);
    expect(screen.getByRole("button", { name: /wake up/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /meal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sleep/i })).not.toBeInTheDocument();
  });

  it("calls onWake when Wake Up is clicked", async () => {
    const user = userEvent.setup();
    const onWake = vi.fn();
    render(<ActionButtons {...defaultProps} isSleeping={true} onWake={onWake} />);
    await user.click(screen.getByRole("button", { name: /wake up/i }));
    expect(onWake).toHaveBeenCalledTimes(1);
  });

  it("Wake Up button is not disabled", () => {
    render(<ActionButtons {...defaultProps} isSleeping={true} />);
    expect(screen.getByRole("button", { name: /wake up/i })).not.toBeDisabled();
  });
});

describe("ActionButtons (sick)", () => {
  it("shows Medicine button when isSick is true", () => {
    render(<ActionButtons {...defaultProps} isSick={true} />);
    expect(screen.getByRole("button", { name: /medicine/i })).toBeInTheDocument();
  });

  it("calls onMedicine when Medicine is clicked", async () => {
    const user = userEvent.setup();
    const onMedicine = vi.fn();
    render(<ActionButtons {...defaultProps} isSick={true} onMedicine={onMedicine} />);
    await user.click(screen.getByRole("button", { name: /medicine/i }));
    expect(onMedicine).toHaveBeenCalledTimes(1);
  });

  it("disables Chat button when sick", () => {
    render(<ActionButtons {...defaultProps} isSick={true} />);
    expect(screen.getByRole("button", { name: /chat/i })).toBeDisabled();
  });

  it("disables Play button when sick", () => {
    render(<ActionButtons {...defaultProps} isSick={true} energy={80} />);
    expect(screen.getByRole("button", { name: /play/i })).toBeDisabled();
  });
});
