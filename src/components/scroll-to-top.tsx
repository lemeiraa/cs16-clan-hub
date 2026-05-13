import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className={`fixed bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground shadow-lg shadow-black/30 transition-all hover:scale-110 hover:opacity-90 ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
