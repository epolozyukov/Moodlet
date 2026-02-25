import { describe, it, expect, beforeEach } from "vitest";
import { loadPetState, savePetState, getDefaultPetState } from "@/lib/storage";
import type { PetState } from "@/lib/types";

// jsdom provides localStorage in vitest with jsdom environment

describe("getDefaultPetState", () => {
  it("creates a state with the given name", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.name).toBe("Pixel");
  });

  it("starts with hunger, hygiene, energy at 80", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.hunger).toBe(80);
    expect(state.hygiene).toBe(80);
    expect(state.energy).toBe(80);
  });

  it("starts with empty chatHistory", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.chatHistory).toEqual([]);
  });

  it("starts with currentStreak of 1", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.currentStreak).toBe(1);
  });

  it("sets firstOpenDate to today", () => {
    const today = new Date().toISOString().split("T")[0];
    const state = getDefaultPetState("Pixel");
    expect(state.firstOpenDate).toBe(today);
  });

  it("sets lastVisitDate to today", () => {
    const today = new Date().toISOString().split("T")[0];
    const state = getDefaultPetState("Pixel");
    expect(state.lastVisitDate).toBe(today);
  });

  it("starts with isSleeping false", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.isSleeping).toBe(false);
    expect(state.sleepStartTime).toBeNull();
  });
});

describe("savePetState / loadPetState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when localStorage is empty", () => {
    const result = loadPetState();
    expect(result).toBeNull();
  });

  it("saves and loads pet state correctly", () => {
    const state = getDefaultPetState("Sparky");
    savePetState(state);
    const loaded = loadPetState();
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("Sparky");
    expect(loaded!.hunger).toBe(80);
  });

  it("loads modified state correctly", () => {
    const state = getDefaultPetState("Sparky");
    const modified: PetState = { ...state, hunger: 55, currentStreak: 5 };
    savePetState(modified);
    const loaded = loadPetState();
    expect(loaded!.hunger).toBe(55);
    expect(loaded!.currentStreak).toBe(5);
  });

  it("overwrites previous save on second call", () => {
    const state1 = getDefaultPetState("Sparky");
    const state2: PetState = { ...state1, name: "Fluffy", hunger: 30 };
    savePetState(state1);
    savePetState(state2);
    const loaded = loadPetState();
    expect(loaded!.name).toBe("Fluffy");
    expect(loaded!.hunger).toBe(30);
  });

  it("returns null if stored data is corrupted", () => {
    localStorage.setItem("moodlet_pet", "not-valid-json{{{");
    const result = loadPetState();
    expect(result).toBeNull();
  });
});
