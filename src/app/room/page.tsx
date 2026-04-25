"use client";

import { useEffect, useState, useRef } from "react";
import { motion, Variants } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Play, Pause } from "lucide-react";
import Link from "next/link";

interface Whisper {
  id: string;
  text: string;
  pseudonym?: string;
  createdAt: string;
  audioUrl?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeInOut" as const,
    },
  },
};

function WhisperCard({ whisper }: { whisper: Whisper }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const handleReact = async (type: string) => {
    setActiveReaction(type);
    // Remove the glow after a brief moment to return to gray
    setTimeout(() => setActiveReaction(null), 800);

    try {
      await fetch(`/api/whispers/${whisper.id}/react`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch {
      // Silently fail (no intrusive UI errors in the dark room)
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current && whisper.audioUrl) {
      const audio = new Audio(whisper.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Safe fallback if date parsing fails
  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(whisper.createdAt), {
      addSuffix: true,
    });
  } catch {
    timeAgo = "some time ago";
  }

  const author = whisper.pseudonym?.trim() ? whisper.pseudonym : "anonymous";

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center text-center space-y-6 my-32 w-full"
    >
      <p
        className="text-[1.25rem] italic text-[#d1d5db] max-w-2xl px-6 leading-relaxed"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        &quot;{whisper.text}&quot;
      </p>

      <div
        className="flex items-center space-x-3 text-sm text-[#52525b]"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {whisper.audioUrl && (
          <button
            onClick={toggleAudio}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#27272a] hover:bg-[#18181b] hover:text-[#d1d5db] transition-colors"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause size={14} className="text-[#d1d5db]" />
            ) : (
              <Play size={14} className="ml-0.5 text-[#d1d5db]" />
            )}
          </button>
        )}
        <span>
          — {author} · {timeAgo}
        </span>
      </div>

      <div
        className="flex space-x-6 text-xs text-[#52525b]"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {["felt this", "not alone", "i understand"].map((reaction) => (
          <button
            key={reaction}
            onClick={() => handleReact(reaction)}
            className={`transition-all duration-500 tracking-wider ${
              activeReaction === reaction
                ? "text-[#d1d5db]"
                : "hover:text-[#a1a1aa]"
            }`}
            style={
              activeReaction === reaction
                ? { textShadow: "0 0 8px rgba(209, 213, 219, 0.4)" }
                : {}
            }
          >
            {reaction}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function RoomPage() {
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWhispers() {
      try {
        const res = await fetch("/api/whispers");
        if (res.ok) {
          const data = await res.json();
          // Adjust based on the actual API structure
          setWhispers(data.whispers || data || []);
        }
      } catch (error) {
        console.error("Failed to load whispers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWhispers();
  }, []);

  return (
    <main className="relative min-h-screen bg-[#0e0e0e] flex flex-col items-center pt-20 pb-32">
      {loading ? (
        <div className="w-full max-w-3xl flex flex-col items-center pt-16 space-y-32">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-12 rounded-2xl bg-[#52525b] opacity-10 animate-pulse ${
                i === 1 ? "w-3/4" : i === 2 ? "w-1/2" : "w-2/3"
              }`}
            />
          ))}
        </div>
      ) : whispers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-[1.25rem] text-[#d1d5db] italic"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            The room is silent. Be the first to speak.
          </motion.div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl flex flex-col items-center"
        >
          {whispers.map((whisper) => (
            <WhisperCard key={whisper.id} whisper={whisper} />
          ))}
        </motion.div>
      )}

      {/* Floating back button */}
      <Link
        href="/"
        className="fixed bottom-8 left-8 text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        &larr; release yours
      </Link>
    </main>
  );
}
