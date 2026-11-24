"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setFollowing } from "@/app/actions";

export default function FollowButton({ username, following, loggedIn }: { username: string; following: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(following);
  const [pending, start] = useTransition();
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
      className={`rounded-full px-5 py-2 text-sm font-medium transition ${on ? "bg-white ring-1 ring-black/15 hover:bg-red-50 hover:text-red-700" : "bg-ink text-paper hover:opacity-90"}`}
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}
