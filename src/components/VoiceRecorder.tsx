"use client";

import { useState, useRef } from "react";
import { Mic, X } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceRecorderProps {
  onRecordingComplete: (base64Audio: string | null) => void;
}

type RecordState = "idle" | "recording" | "done";

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          onRecordingComplete(base64String);
        };
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordState("recording");

      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setRecordState("done");
        }
      }, 30000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (mediaRecorderRef.current && recordState === "recording") {
      mediaRecorderRef.current.stop();
      setRecordState("done");
    }
  };

  const handleDiscard = () => {
    setRecordState("idle");
    audioChunksRef.current = [];
    onRecordingComplete(null);
  };

  const handleClick = () => {
    if (recordState === "idle") {
      startRecording();
    } else if (recordState === "recording") {
      stopRecording();
    }
  };

  if (recordState === "done") {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#3b3b3b] bg-transparent">
          {/* Static minimal waveform */}
          <div className="flex items-end space-x-[2px] h-4">
            <div className="w-[3px] bg-[#d1d5db] h-2 rounded-full" />
            <div className="w-[3px] bg-[#d1d5db] h-4 rounded-full" />
            <div className="w-[3px] bg-[#d1d5db] h-3 rounded-full" />
            <div className="w-[3px] bg-[#d1d5db] h-4 rounded-full" />
            <div className="w-[3px] bg-[#d1d5db] h-2 rounded-full" />
          </div>
        </div>
        <button
          onClick={handleDiscard}
          className="text-[#52525b] hover:text-[#d1d5db] transition-colors"
          aria-label="Discard recording"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <motion.button
        onClick={handleClick}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-transparent outline-none transition-colors"
        style={{
          border: recordState === "recording" ? "1px solid #7f1d1d" : "1px solid #3b3b3b",
        }}
        animate={
          recordState === "recording"
            ? {
                boxShadow: ["0 0 0 0 rgba(127, 29, 29, 0.4)", "0 0 0 10px rgba(127, 29, 29, 0)"],
              }
            : { boxShadow: "none" }
        }
        transition={
          recordState === "recording"
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : {}
        }
        aria-label={recordState === "idle" ? "Record voice note" : "Stop recording"}
      >
        <Mic
          size={20}
          className={`transition-colors ${
            recordState === "recording" ? "text-[#7f1d1d]" : "text-[#52525b]"
          }`}
        />
      </motion.button>
      {recordState === "idle" && (
        <span 
          className="text-xs text-[#52525b]"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          max 30 sec
        </span>
      )}
    </div>
  );
}
