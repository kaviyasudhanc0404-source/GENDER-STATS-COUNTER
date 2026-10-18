import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { toastHost } from "@/lib/toast-host";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string; // id of the element holding the modal's title
  children: ReactNode;
}

/**
 * Native modal dialog (focus trap, Esc to close) with a close button and click-outside to close.
 * The content is only mounted while open, so forms inside start fresh every time.
 */
const Modal = ({ open, onClose, labelledBy, children }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    toastHost.set(dialog); // show notifications inside the modal, above its backdrop
    return () => {
      if (dialog.open) dialog.close();
      toastHost.set(null);
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()} // click on the backdrop
      aria-labelledby={labelledBy}
      className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-3xl border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm sm:max-w-md"
    >
      {open && (
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
};

export default Modal;
