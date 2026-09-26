import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

/**
 * Shared split-screen shell for /login, /forgot-password, /reset-password.
 *
 * Left: the rotating brand showcase (desktop only — see AuthShowcase).
 * Right: a white surface holding whichever form the page passes in, with the
 * clinic photograph anchored bottom-right. The photo asset already fades to
 * transparent along its top/left edges, so it dissolves into the white panel
 * without needing a mask or an overlay gradient here.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full w-full flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <AuthShowcase />

      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-surface px-5 py-12 sm:px-8 lg:px-14">
        <Image
          src="/brand/login-photo.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="auth-photo-in pointer-events-none absolute bottom-0 right-0 w-[62%] max-w-[680px] select-none object-contain sm:w-[70%] lg:w-[78%]"
        />

        <Link
          href="/login"
          className="relative z-10 mb-8 rounded-[var(--radius-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] lg:hidden"
          aria-label="Purity home"
        >
          <Logo height={44} />
        </Link>

        <div className="relative z-10 w-full max-w-[26rem]">{children}</div>
      </div>
    </div>
  );
}
