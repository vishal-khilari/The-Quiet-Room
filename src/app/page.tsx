"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import VoiceRecorder from "@/components/VoiceRecorder";

export default function Home() {
  const [whisper, setWhisper] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | boolean>(false);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [whisper]);

  const handleRelease = async () => {
    if (!whisper.trim()) return;
    
    setIsSubmitting(true);
    setSubmitError(false);

    try {
      const res = await fetch("/api/whispers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: whisper, pseudonym, audioBase64 }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        if (res.status === 429) {
          throw new Error("429");
        }
        throw new Error("Failed");
      }

      setIsSuccess(true);
      
      // Wait for animation to complete before redirecting
      setTimeout(() => {
        router.push("/room");
      }, 1500);
    } catch (error: unknown) {
      console.error("Failed to release whisper", error);
      setIsSubmitting(false);
      const err = error as Error;
      if (err.message === "429") {
        setSubmitError("429");
      } else {
        setSubmitError(true);
      }
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0e0e0e] text-[#d1d5db]">
      {/* Soft breathing background */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(circle at center, #1a1a1a 0%, #0e0e0e 70%)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 text-center">
        <motion.h1 
          className="mb-2 text-4xl md:text-5xl font-normal tracking-wide text-[#d1d5db]"
          style={{ fontFamily: "var(--font-playfair)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          The Quiet Room
        </motion.h1>
        
        <motion.p 
          className="mb-12 text-lg text-[#52525b] italic"
          style={{ fontFamily: "var(--font-playfair)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Say what you cannot say out loud.
        </motion.p>

        <AnimatePresence mode="wait">
          {!isSuccess && (
            <motion.div 
              key="form"
              className="flex w-full flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40, filter: "blur(4px)" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className="relative w-full">
                <textarea
                  ref={textareaRef}
                  value={whisper}
                  onChange={(e) => setWhisper(e.target.value)}
                  maxLength={500}
                  placeholder="Whisper here..."
                  className="w-full resize-none border-b border-[#27272a] bg-transparent pb-8 text-center text-xl text-[#d1d5db] placeholder:text-[#52525b] focus:border-[#52525b] focus:outline-none"
                  style={{ fontFamily: "var(--font-playfair)", minHeight: "120px" }}
                  rows={1}
                  spellCheck={false}
                />
                <span 
                  className={`absolute bottom-3 right-0 text-xs transition-colors duration-500 ${whisper.length > 400 ? "text-[#d1d5db]" : "text-[#52525b]"}`}
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {whisper.length}/500
                </span>
              </div>
              
              <input
                type="text"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                placeholder="Sign as... (optional)"
                className="mt-6 w-1/2 border-b border-transparent bg-transparent pb-1 text-center text-sm text-[#d1d5db] placeholder:text-[#52525b] focus:border-[#27272a] focus:outline-none"
                style={{ fontFamily: "var(--font-inter)" }}
                spellCheck={false}
              />

              <div className="mt-10 flex flex-col items-center space-y-3">
                <span 
                  className="text-xs text-[#52525b]"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  attach your voice (optional)
                </span>
                <VoiceRecorder onRecordingComplete={setAudioBase64} />
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={handleRelease}
                  disabled={whisper.trim().length < 3 || isSubmitting}
                  className="mt-12 rounded-full border border-[#27272a] px-8 py-2 text-sm text-[#a1a1aa] transition-colors hover:bg-[#18181b] hover:text-[#d1d5db] disabled:opacity-30 disabled:hover:bg-transparent"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {isSubmitting ? <span className="italic">releasing...</span> : "Release it"}
                </button>
                {submitError && (
                  <span 
                    className="mt-4 text-[#7f1d1d] text-xs" 
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {submitError === "429" 
                      ? "you&apos;ve whispered enough for now. return later." 
                      : submitError === "413" 
                        ? "voice note too long. try a shorter recording." 
                        : "the void didn&apos;t receive it. try again."}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link 
        href="/room" 
        className="absolute bottom-8 right-8 text-sm text-[#52525b] transition-colors hover:text-[#a1a1aa]"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Enter the room &rarr;
      </Link>
    </main>
  );
}
