export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <img src="/paw.png" alt="" width={64} height={64} className="animate-pulse" />
      <p className="text-sm font-bold text-pink-400 tracking-widest uppercase animate-pulse">Loading</p>
    </div>
  );
}
