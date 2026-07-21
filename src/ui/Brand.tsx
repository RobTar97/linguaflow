import { MessageCircle } from "lucide-react";

export function Brand() {
  return (
    <span className="logo" aria-label="LinguaFlow">
      <span className="logo-mark" aria-hidden="true">
        <MessageCircle size={22} fill="currentColor" />
        <span />
      </span>
      <span className="logo-text">
        Lingua<span>Flow</span>
      </span>
    </span>
  );
}
