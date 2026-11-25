"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setFollowing } from "@/app/actions";

/** Follow / Following pill. Hovering "Following" offers to unfollow. */
export default function FollowButton({ username, following, loggedIn, small = false }: { username: string; following: boolean; loggedIn: boolean; small?: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(following);
  const [pending, start] = useTransition();
  const size = small ? "h-8 px-4 text-sm" : "h-9 px-5 text-[15px]";
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!loggedIn) return router.push(`/login?next=/u/${username}`);
        const next = !on;
        setOn(next);
        start(async () => {
          const r = await setFollowing(username, next);
          if (r.error) setOn(!next);
        });
      }}
      className={`group shrink-0 rounded-full font-bold transition ${size} ${
        on ? "ring-1 ring-line hover:bg-red-500/10 hover:text-red-500 hover:ring-red-500/40" : "bg-fg text-bg hover:opacity-90"
      }`}
    >
      {on ? (
        <>
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        "Follow"
      )}
    </button>
  );
}
