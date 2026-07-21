import Link from "next/link";

const items = [
  { href: "/practice", label: "Practice" },
  { href: "/add", label: "Add" },
  { href: "/browse", label: "Browse" },
  { href: "/read", label: "Read" },
  { href: "/stats", label: "Stats" },
  { href: "/settings", label: "Settings" },
];

export function LeftRail() {
  return (
    <nav className="flex w-40 shrink-0 flex-col gap-1 border-r border-neutral-200 p-4 dark:border-neutral-800">
      <span className="mb-4 px-2 text-sm font-semibold tracking-tight">Cloze</span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
