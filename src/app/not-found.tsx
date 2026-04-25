import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0e0e0e] text-[#d1d5db]">
      <div className="text-center">
        <h2 
          className="text-2xl italic text-[#d1d5db] mb-8"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          This room doesn&apos;t exist.
        </h2>
        <Link 
          href="/" 
          className="text-sm text-[#52525b] transition-colors hover:text-[#a1a1aa]"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          &larr; return
        </Link>
      </div>
    </main>
  );
}
