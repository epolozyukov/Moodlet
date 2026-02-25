"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PetState, ChatMessage } from "@/lib/types";
import { loadPetState, savePetState, getDefaultPetState } from "@/lib/storage";
import { applyCrossSessionDecay, applyTickDecay } from "@/lib/decayEngine";
import { updateStreak } from "@/lib/streak";
import { applyAction, computeMood, getMoodLabel, isSick } from "@/lib/petEngine";
import { sendChatMessage, AIError } from "@/lib/aiClient";
import { getFallbackMessage } from "@/lib/fallbackMessages";

import NameModal from "./components/NameModal";
import PetSprite from "./components/PetSprite";
import StatsBars from "./components/StatsBars";
import ActionButtons from "./components/ActionButtons";
import ChatWindow from "./components/ChatWindow";

const TICK_INTERVAL_MS = 10_000;
const SLEEP_DURATION_MS = 120_000;
const MAX_CHAT_HISTORY = 10; // 5 exchanges = 10 messages

export default function Home() {
  const [petState, setPetState] = useState<PetState | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadPetState();
    if (!saved) {
      setShowModal(true);
    } else {
      const decayed = applyCrossSessionDecay(saved);
      const streaked = updateStreak(decayed);
      savePetState(streaked);
      setPetState(streaked);
      setChatMessages(streaked.chatHistory);
    }
    setIsHydrated(true);
  }, []);

  // Decay tick
  useEffect(() => {
    if (!petState) return;
    const interval = setInterval(() => {
      setPetState((prev) => {
        if (!prev) return prev;
        const ticked = applyTickDecay(prev, TICK_INTERVAL_MS);
        savePetState(ticked);
        return ticked;
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [petState !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sleep auto-wake
  useEffect(() => {
    if (!petState?.isSleeping || !petState.sleepStartTime) return;

    const remaining = SLEEP_DURATION_MS - (Date.now() - petState.sleepStartTime);
    const delay = Math.max(0, remaining);

    sleepTimerRef.current = setTimeout(() => {
      setPetState((prev) => {
        if (!prev) return prev;
        const woke = applyAction(prev, "wake");
        savePetState(woke);
        return woke;
      });
    }, delay);

    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [petState?.isSleeping]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameSubmit = useCallback((name: string) => {
    const initial = getDefaultPetState(name);
    savePetState(initial);
    setPetState(initial);
    setChatMessages([]);
    setShowModal(false);

    // Greeting message on first launch
    const greeting: ChatMessage = {
      role: "assistant",
      content: `Hi! I'm ${name}. I'm so glad you're here! Take good care of me, okay?`,
    };
    const updated: PetState = { ...initial, chatHistory: [greeting] };
    savePetState(updated);
    setPetState(updated);
    setChatMessages([greeting]);
  }, []);

  const handleAction = useCallback(
    (action: "feed" | "clean" | "sleep") => {
      setPetState((prev) => {
        if (!prev) return prev;
        const next = applyAction(prev, action);
        savePetState(next);
        return next;
      });
    },
    []
  );

  const handleChat = useCallback(
    async (userText: string) => {
      if (!petState || isAILoading) return;

      const userMsg: ChatMessage = { role: "user", content: userText };
      const updatedHistory = [...chatMessages, userMsg].slice(-MAX_CHAT_HISTORY);
      setChatMessages(updatedHistory);
      setIsAILoading(true);

      // Record action
      setPetState((prev) => {
        if (!prev) return prev;
        return applyAction(prev, "chat");
      });

      try {
        const response = await sendChatMessage(userText, petState, chatMessages);
        const assistantMsg: ChatMessage = { role: "assistant", content: response };
        const finalHistory = [...updatedHistory, assistantMsg].slice(-MAX_CHAT_HISTORY);

        setChatMessages(finalHistory);
        setPetState((prev) => {
          if (!prev) return prev;
          const next = { ...prev, chatHistory: finalHistory };
          savePetState(next);
          return next;
        });
      } catch (err) {
        const moodLabel = getMoodLabel(computeMood(petState));
        const fallback = err instanceof AIError
          ? getFallbackMessage(petState, moodLabel)
          : getFallbackMessage(petState, moodLabel);

        const fallbackMsg: ChatMessage = { role: "assistant", content: fallback };
        const finalHistory = [...updatedHistory, fallbackMsg].slice(-MAX_CHAT_HISTORY);
        setChatMessages(finalHistory);
        setPetState((prev) => {
          if (!prev) return prev;
          const next = { ...prev, chatHistory: finalHistory };
          savePetState(next);
          return next;
        });
      } finally {
        setIsAILoading(false);
      }
    },
    [petState, chatMessages, isAILoading]
  );

  if (!isHydrated) return null;

  if (showModal) {
    return <NameModal onSubmit={handleNameSubmit} />;
  }

  if (!petState) return null;

  const mood = computeMood(petState);
  const moodLabel = getMoodLabel(mood);
  const sick = isSick(petState);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gb-dark">
      <div className="w-full max-w-2xl bg-gb-screen border-4 border-gb-dark shadow-pixel p-4 md:p-6">
        {/* Header: pet name + streak */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-mono text-gb-dark text-xs">{petState.name}</h1>
          <span className="font-mono text-gb-dark text-xs bg-gb-mid text-gb-screen px-2 py-1 border border-gb-dark shadow-pixel-sm">
            Day {petState.currentStreak}
          </span>
        </div>

        {/* Pet sprite — centered */}
        <div className="flex justify-center mb-4">
          <PetSprite
            moodLabel={moodLabel}
            isSick={sick}
            isSleeping={petState.isSleeping}
          />
        </div>

        {/* Stats bars */}
        <div className="mb-4">
          <StatsBars
            hunger={petState.hunger}
            hygiene={petState.hygiene}
            energy={petState.energy}
            mood={mood}
          />
        </div>

        {/* Bottom: actions + chat */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2">
            <ActionButtons
              onFeed={() => handleAction("feed")}
              onClean={() => handleAction("clean")}
              onSleep={() => handleAction("sleep")}
              onChat={() => {}} // Chat is always visible in the window
              isSleeping={petState.isSleeping}
              isSick={sick}
              isAILoading={isAILoading}
            />
          </div>
          <div className="md:w-1/2 h-64">
            <ChatWindow
              messages={chatMessages}
              onSend={handleChat}
              disabled={sick || petState.isSleeping}
              isLoading={isAILoading}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
