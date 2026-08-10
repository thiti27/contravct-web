import { MessageSquare } from 'lucide-react';
import TextAreaField from '../../../components/ui/TextAreaField';
import { formatDateTime } from '../../../lib/formatDate';

function CommentItem({ comment }) {
  const initial = (comment.name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{initial}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-navy">{comment.name || 'Unknown'}</span>
            {comment.role && (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">{comment.role}</span>
            )}
          </div>
          <span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{comment.comment}</p>
      </div>
    </div>
  );
}

export default function CommentSection({ formik, required, error, comments = [], sectionRef, readOnly = false }) {
  return (
    <section ref={sectionRef}>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
          <MessageSquare size={19} />
        </span>
        <div>
          <div className="font-bold text-navy">Comment</div>
          <div className="text-sm text-slate-500">Requester / Supervisor / LG / Others (ถ้ามี)</div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {comments.length > 0 && (
          <div className="space-y-4 border-b border-slate-100 pb-5">
            {comments.map(c => (
              <CommentItem key={c.id} comment={c} />
            ))}
          </div>
        )}

        {!readOnly && (
          <TextAreaField
            name="comment"
            value={formik.values.comment}
            onChange={formik.handleChange}
            required={required}
            error={error}
            rows={3}
            placeholder="เพิ่มความคิดเห็น (ถ้ามี)..."
          />
        )}
      </div>
    </section>
  );
}
