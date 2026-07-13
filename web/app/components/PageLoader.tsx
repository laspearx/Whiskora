export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main paw pad */}
        <ellipse cx="32" cy="40" rx="16" ry="13" fill="#F9A8C9"/>
        {/* Toe beans */}
        <ellipse cx="19" cy="26" rx="6" ry="7.5" fill="#F9A8C9"/>
        <ellipse cx="29" cy="21" rx="6" ry="7.5" fill="#F9A8C9"/>
        <ellipse cx="39" cy="21" rx="6" ry="7.5" fill="#F9A8C9"/>
        <ellipse cx="49" cy="26" rx="6" ry="7.5" fill="#F9A8C9"/>
      </svg>
      <p className="text-sm font-bold text-pink-400 tracking-widest uppercase animate-pulse">Loading</p>
    </div>
  );
}
