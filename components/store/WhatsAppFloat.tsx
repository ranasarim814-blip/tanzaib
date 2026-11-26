import { getSettings } from "@/lib/data/catalog";
import { whatsappLink } from "@/lib/utils";

export async function WhatsAppFloat() {
  const s = await getSettings();
  return (
    <a
      href={whatsappLink(s.whatsapp_number, "Assalam o Alaikum Tanzaib, I'd like some help with a piece.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Tanzaib on WhatsApp"
      className="no-print group fixed right-4 bottom-4 z-40 grid size-13 place-items-center rounded-full bg-ink text-ivory shadow-[0_10px_30px_-10px_rgba(28,26,23,0.6)] ring-1 ring-brass/70 ring-offset-2 ring-offset-ivory transition-transform duration-500 ease-[var(--ease-luxe)] hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="size-5.5" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.46 9.46 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.23-4.25 9.47-9.47 9.47zm8.07-17.54A11.33 11.33 0 0 0 12.04.62C5.75.62.63 5.74.63 12.03c0 2.01.52 3.97 1.52 5.7L.53 23.62l6.03-1.58a11.4 11.4 0 0 0 5.47 1.39h.01c6.29 0 11.41-5.12 11.41-11.41 0-3.05-1.19-5.91-3.34-8.07z" />
      </svg>
    </a>
  );
}
