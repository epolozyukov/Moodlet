import { describe, it, expect, beforeEach } from "vitest";
import { loadPetState, savePetState, getDefaultPetState } from "@/lib/storage";
import type { PetState } from "@/lib/types";

describe("getDefaultPetState", () => {
  it("creates a state with the given name", () => {
    expect(getDefaultPetState("Pixel").name).toBe("Pixel");
  });

  it("starts with hunger, hygiene, energy at 80", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.hunger).toBe(80);
    expect(state.hygiene).toBe(80);
    expect(state.energy).toBe(80);
  });

  it("starts with happiness at 80 and health at 100", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.happiness).toBe(80);
    expect(state.health).toBe(100);
  });

  it("starts with isSick false and isDead false", () => {
    const state = getDefaultPetState("Pixel");
    expect(state.isSick).toBe(false);
    expect(state.isDead).toBe(false);
  });

  it("starts in egg stage", () => {
    expect(getDefaultPetState("Pixel").stage).toBe("egg");
  });

  it("starts with careScore at 80", () => {
    expect(getDefaultPetState("Pixel").careScore).toBe(80);
  });

  it("starts with empty chatHistory", () => {
    expect(getDefaultPetState("Pixel").chatHistory).toEqual([]);
  });

  it("starts with currentStreak of 1", () => {
    expect(getDefaultPetState("Pixel").currentStreak).toBe(1);
  });

  it("sets firstOpenDate to today", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(getDefaultPetState("Pixel").firstOpenDate).toBe(today);
  });

  it("sets lastVisitDate to today", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(getDefaultPetState("Pixel").lastVisitDate).toBe(today);
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
    expect(loadPetState()).toBeNull();
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
    expect(loadPetState()).toBeNull();
  });

  it("migrates old save by filling in missing new fields with defaults", () => {
    // Simulate an old save without new fields
    const oldSave = {
      name: "OldPet",
      hunger: 60,
      hygiene: 70,
      energy: 50,
      lastUpdated: Date.now(),
      isSleeping: false,
      sleepStartTime: null,
      firstOpenDate: "2026-01-01",
      lastVisitDate: "2026-01-01",
      currentStreak: 3,
      chatHistory: [],
      lastUserAction: "none",
    };
    localStorage.setItem("moodlet_pet", JSON.stringify(oldSave));
    const loaded = loadPetState();
    expect(loaded).not.toBeNull();
    // Old fields preserved
    expect(loaded!.name).toBe("OldPet");
    expect(loaded!.hunger).toBe(60);
    expect(loaded!.currentStreak).toBe(3);
    // New fields filled from defaults
    expect(loaded!.happiness).toBe(80);
    expect(loaded!.health).toBe(100);
    expect(loaded!.isSick).toBe(false);
    expect(loaded!.isDead).toBe(false);
    expect(loaded!.stage).toBe("egg");
    expect(loaded!.careScore).toBe(80);
  });
});
