import { SearchIcon } from "../icons";

/** The round search field (sends you to the Explore page with results). */
export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/explore" className="group flex h-11 items-center gap-3 rounded-full bg-soft px-4 ring-accent focus-within:bg-bg focus-within:ring-1">
      <SearchIcon size={18} className="text-muted group-focus-within:text-accent" />
      <input name="q" defaultValue={defaultValue} placeholder="Search poems and writers" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
    </form>
  );
}
