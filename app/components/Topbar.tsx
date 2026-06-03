import Link from "next/link";
import Image from "next/image";

export function Topbar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/admin" className="wordmark">
          <span className="glyph">
            <Image src="/logo.png" alt="Shakers" width={30} height={30} priority />
          </span>
          <span>Moodboard</span>
          <span className="sub">Shakers</span>
        </Link>
        <div className="topbar-actions">{children}</div>
      </div>
    </header>
  );
}
