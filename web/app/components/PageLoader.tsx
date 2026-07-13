export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pink circle background */}
        <circle cx="50" cy="50" r="50" fill="#E84677"/>
        {/* Toe beans (white) */}
        <ellipse cx="26" cy="36" rx="8" ry="10.5" fill="white" transform="rotate(-18 26 36)"/>
        <ellipse cx="41" cy="26" rx="8" ry="10.5" fill="white" transform="rotate(-5 41 26)"/>
        <ellipse cx="59" cy="26" rx="8" ry="10.5" fill="white" transform="rotate(5 59 26)"/>
        <ellipse cx="74" cy="36" rx="8" ry="10.5" fill="white" transform="rotate(18 74 36)"/>
        {/* Main pad */}
        <ellipse cx="50" cy="65" rx="19" ry="16" fill="white"/>
      </svg>
      <p className="text-sm font-bold text-pink-400 tracking-widest uppercase animate-pulse">Loading</p>
    </div>
  );
}
