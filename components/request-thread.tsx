import { postMessage } from "@/app/portal/actions";
import { ActionForm, SubmitButton } from "@/components/form";
import { displayName } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// The conversation on a change request, with a reply box. Shared by the portal and
// the staff area; row level security decides who can read and reply.
export async function RequestThread({ requestId }: { requestId: string }) {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("request_messages")
    .select("id, body, created_at, author:profiles(full_name, email, role)")
    .eq("request_id", requestId)
    .order("created_at");

  return (
    <div className="stack">
      <div className="thread">
        {messages?.map((message) => {
          const staff = message.author?.role === "admin";
          return (
            <article className={staff ? "msg msg--staff" : "msg"} key={message.id}>
              <header>
                <strong>{message.author ? displayName(message.author) : "Former member"}</strong>
                {staff && <span className="pill">Kata</span>}
                <time dateTime={message.created_at}>{formatDateTime(message.created_at)}</time>
              </header>
              <p>{message.body}</p>
            </article>
          );
        })}
      </div>
      <ActionForm action={postMessage} className="stack">
        <input type="hidden" name="requestId" value={requestId} />
        <div className="field">
          <label className="f" htmlFor="reply">
            Reply
          </label>
          <textarea id="reply" name="body" required maxLength={10000} placeholder="Write a reply…" />
        </div>
        <div>
          <SubmitButton pendingLabel="Sending…">Send reply</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
