import Link from "next/link";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

/** One writer in a list: picture, name, @username, bio, and a Follow button. */
export default function PersonRow({ person, showFollow, following = false, loggedIn }: { person: { username: string; name: string; bio?: string }; showFollow: boolean; following?: boolean; loggedIn: boolean }) {
  return (
    <div className="flex gap-3 border-b border-line px-4 py-3 hover:bg-hover/40">
      <Link href={`/u/${person.username}`}><Avatar name={person.name} username={person.username} size={40} /></Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/u/${person.username}`} className="min-w-0 leading-tight">
            <span className="block truncate font-bold hover:underline">{person.name}</span>
            <span className="block truncate text-[15px] text-muted">@{person.username}</span>
          </Link>
          {showFollow && <FollowButton username={person.username} following={following} loggedIn={loggedIn} small />}
        </div>
        {person.bio && <p className="mt-1 text-[15px]">{person.bio}</p>}
      </div>
    </div>
  );
}
