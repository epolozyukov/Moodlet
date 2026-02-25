"use client";

import { useState, useEffect, useCallback } from "react";
import type { PetState, ChatMessage } from "@/lib/types";
import { loadPetState, savePetState, getDefaultPetState } from "@/lib/storage";
import { applyCrossSessionDecay, applyTickDecay } from "@/lib/decayEngine";
import { updateStreak } from "@/lib/streak";
import { applyAction, computeMood, getMoodLabel } from "@/lib/petEngine";
import { sendChatMessage, AIError } from "@/lib/aiClient";
import { getFallbackMessage } from "@/lib/fallbackMessages";
import { shouldAlert } from "@/lib/alerts";

import NameModal from "./components/NameModal";
import PetSprite from "./components/PetSprite";
import StatsBars from "./components/StatsBars";
import ActionButtons from "./components/ActionButtons";
import ChatWindow from "./components/ChatWindow";

const TICK_INTERVAL_MS = 10_000;
const MAX_CHAT_HISTORY = 10; // 5 exchanges = 10 messages

export default function Home() {
  const [petState, setPetState] = useState<PetState | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAlert, setIsAlert] = useState(false);

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
        // Check alert
        if (shouldAlert(ticked)) {
          setIsAlert(true);
          const alerted = { ...ticked, lastAlertTime: Date.now() };
          savePetState(alerted);
          setTimeout(() => setIsAlert(false), 3000);
          return alerted;
        }
        savePetState(ticked);
        return ticked;
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [petState !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameSubmit = useCallback((name: string) => {
    const initial = getDefaultPetState(name);
    const greeting: ChatMessage = {
      role: "assistant",
      content: `Hi! I'm ${name}. I'm so glad you're here! Take good care of me, okay?`,
    };
    const withGreeting: PetState = { ...initial, chatHistory: [greeting] };
    savePetState(withGreeting);
    setPetState(withGreeting);
    setChatMessages([greeting]);
    setShowModal(false);
  }, []);

  const handleAction = useCallback(
    (action: "meal" | "snack" | "play" | "clean" | "sleep" | "wake" | "medicine") => {
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
        const fallback =
          err instanceof AIError
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

  const handleRestart = useCallback(() => {
    localStorage.removeItem("moodlet_pet");
    window.location.reload();
  }, []);

  if (!isHydrated) return null;

  if (showModal) {
    return <NameModal onSubmit={handleNameSubmit} />;
  }

  if (!petState) return null;

  // Death screen
  if (petState.isDead) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gb-dark">
        <div className="w-full max-w-sm bg-gb-screen border-4 border-gb-dark shadow-pixel p-8 text-center">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="font-mono text-gb-dark text-sm mb-2">
            {petState.name} has passed away.
          </h1>
          <p className="font-mono text-gb-dark text-xs opacity-70 mb-6">
            They lived to stage: {petState.stage}. Care score: {Math.round(petState.careScore)}.
          </p>
          <button
            onClick={handleRestart}
            className="font-mono text-xs bg-gb-mid text-gb-screen border-2 border-gb-dark shadow-pixel-sm px-6 py-2
              hover:bg-gb-dark active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-none"
          >
            Start Over
          </button>
        </div>
      </main>
    );
  }

  const mood = computeMood(petState);
  const moodLabel = getMoodLabel(mood);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gb-dark">
      <div className="w-full max-w-2xl bg-gb-screen border-4 border-gb-dark shadow-pixel p-4 md:p-6">
        {/* Header: pet name + streak + stage */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-mono text-gb-dark text-xs">
            {petState.name}
            <span className="opacity-60 ml-2">[{petState.stage}]</span>
          </h1>
          <span className="font-mono text-gb-dark text-xs bg-gb-mid text-gb-screen px-2 py-1 border border-gb-dark shadow-pixel-sm">
            Day {petState.currentStreak}
          </span>
        </div>

        {/* Pet sprite — centered */}
        <div className="flex justify-center mb-4">
          <PetSprite
            moodLabel={moodLabel}
            isSick={petState.isSick}
            isSleeping={petState.isSleeping}
            stage={petState.stage}
            isAlert={isAlert}
          />
        </div>

        {/* Stats bars */}
        <div className="mb-4">
          <StatsBars
            hunger={petState.hunger}
            hygiene={petState.hygiene}
            energy={petState.energy}
            happiness={petState.happiness}
            health={petState.health}
            mood={mood}
          />
        </div>

        {/* Bottom: actions + chat */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2">
            <ActionButtons
              onMeal={() => handleAction("meal")}
              onSnack={() => handleAction("snack")}
              onPlay={() => handleAction("play")}
              onClean={() => handleAction("clean")}
              onSleep={() => handleAction("sleep")}
              onWake={() => handleAction("wake")}
              onMedicine={() => handleAction("medicine")}
              onChat={() => {}}
              isSleeping={petState.isSleeping}
              isSick={petState.isSick}
              isAILoading={isAILoading}
              energy={petState.energy}
            />
          </div>
          <div className="md:w-1/2 h-64">
            <ChatWindow
              messages={chatMessages}
              onSend={handleChat}
              disabled={petState.isSick || petState.isSleeping}
              isLoading={isAILoading}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
