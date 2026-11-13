import { signOut } from "@/app/auth/actions";
import { displayName, type Viewer } from "@/lib/auth";

export function SideFoot({ viewer, subtitle }: { viewer: Viewer; subtitle?: string | null }) {
  return (
    <div className="side-foot">
      <strong>{displayName(viewer)}</strong>
      <span>{subtitle ?? viewer.email}</span>
      <form action={signOut}>
        <button type="submit" className="link-btn">
          Sign out
        </button>
      </form>
    </div>
  );
}
