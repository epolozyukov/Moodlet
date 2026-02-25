"use client";

import { useState, FormEvent } from "react";

interface NameModalProps {
  onSubmit: (name: string) => void;
}

export default function NameModal({ onSubmit }: NameModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Your pet needs a name!");
      return;
    }
    if (trimmed.length > 20) {
      setError("Name must be 20 characters or less.");
      return;
    }
    setError("");
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gb-dark/80 z-50">
      <div className="bg-gb-screen border-4 border-gb-dark shadow-pixel p-8 max-w-sm w-full mx-4">
        <h2 className="font-mono text-gb-dark text-sm mb-4 text-center">
          NAME YOUR PET
        </h2>
        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bubbles"
            className="w-full bg-gb-light border-2 border-gb-dark font-mono text-gb-dark text-sm p-2 mb-3 focus:outline-none focus:border-gb-mid shadow-pixel-inset"
            autoFocus
          />
          {error && (
            <p role="alert" className="font-mono text-xs text-red-700 mb-3">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-gb-mid text-gb-screen font-mono text-sm py-2 px-4 border-2 border-gb-dark shadow-pixel-sm hover:bg-gb-dark active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-none"
          >
            START
          </button>
        </form>
      </div>
    </div>
  );
}
