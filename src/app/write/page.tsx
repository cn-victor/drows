import { Suspense } from "react";
import Writer from "@/components/Writer";
import { getPoem } from "@/server/db";

export const metadata = { title: "Write" };

async function LoadWriter({ searchParams }: { searchParams: PageProps<"/write">["searchParams"] }) {
  const sp = await searchParams;
  const id = typeof sp.edit === "string" ? sp.edit : null;
  const poem = id ? await getPoem(id) : null;
  return <Writer key={poem?.id ?? "new"} initial={poem} />;
}

export default function WritePage(props: PageProps<"/write">) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Opening your page…</div>}>
      <LoadWriter searchParams={props.searchParams} />
    </Suspense>
  );
}
