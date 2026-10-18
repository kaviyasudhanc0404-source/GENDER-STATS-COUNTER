import { ShieldCheck } from "lucide-react";

const Footer = () => (
  <footer className="container max-w-6xl px-4 pb-6 sm:px-6">
    <p className="flex items-start justify-center gap-2 text-center text-xs text-muted-foreground">
      <ShieldCheck className="mt-px h-4 w-4 shrink-0" />
      For aggregate statistics only. It does not identify people or determine anyone's gender identity or expression.
    </p>
  </footer>
);

export default Footer;
