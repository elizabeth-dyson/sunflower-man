'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

type NotionTask = {
  id: string;
  task: string;
  contentName: string | null;
  goalDate: string | null;
  status: string;
  notes: string | null;
  priority: string | null;
};

type CeoTask = {
  id: string;
  title: string;
  done: boolean;
  created_at: string;
  completed_at: string | null;
};

const DEFAULT_LIMIT = 10;

export default function TaskCenter() {
  const supabase = useSupabaseClient();

  const [ceoTasks, setCeoTasks] = useState<CeoTask[] | null>(null);
  const [ceoError, setCeoError] = useState<string | null>(null);
  const [ceoExpanded, setCeoExpanded] = useState(false);

  const [notionTasks, setNotionTasks] = useState<NotionTask[] | null>(null);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [notionExpanded, setNotionExpanded] = useState(false);

  const priorityRank = (p?: string | null) =>
    p === 'High' ? 0 : p === 'Medium' ? 1 : p === 'Low' ? 2 : 3;

  const massiveCustomSort = (a: NotionTask, b: NotionTask) => {
    const ad = a.goalDate ? new Date(a.goalDate).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.goalDate ? new Date(b.goalDate).getTime() : Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;

    const ap = priorityRank(a.priority);
    const bp = priorityRank(b.priority);
    if (ap !== bp) return ap - bp;

    const ac = (a.contentName ?? '\uFFFF').toLocaleLowerCase();
    const bc = (b.contentName ?? '\uFFFF').toLocaleLowerCase();
    if (ac !== bc) return ac.localeCompare(bc);

    const at = (a.task ?? '').toLocaleLowerCase();
    const bt = (b.task ?? '').toLocaleLowerCase();
    if (at !== bt) return at.localeCompare(bt);

    return (a.task || '').localeCompare(b.task || '');
  };

  useEffect(() => {
    (async () => {
      setCeoError(null);
      const { data, error } = await supabase
        .from('ceo_tasks')
        .select('id,title,done,created_at,completed_at')
        .order('created_at', { ascending: false });
      if (error) setCeoError(error.message);
      else setCeoTasks(data as CeoTask[]);
    })();

    const channel = supabase
      .channel('ceo_tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ceo_tasks' },
        (payload) => {
          setCeoTasks((cur) => {
            const list = cur ? [...cur] : [];
            if (payload.eventType === 'INSERT') return [payload.new as CeoTask, ...list];
            if (payload.eventType === 'UPDATE')
              return list.map((t) => (t.id === (payload.new as CeoTask).id ? (payload.new as CeoTask) : t));
            if (payload.eventType === 'DELETE')
              return list.filter((t) => t.id !== (payload.old as CeoTask).id);
            return list;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/notion/tasks', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { tasks: NotionTask[] };
        if (mounted) setNotionTasks(data.tasks);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load Notion tasks';
        if (mounted) setNotionError(msg);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function addCeoTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') || '').trim();
    if (!title) return;
    e.currentTarget.reset();
    const { error } = await supabase.from('ceo_tasks').insert({ title }).select().single();
    if (error) setCeoError(error.message);
  }

  async function toggleCeoTask(id: string, done: boolean) {
    const { error } = await supabase.from('ceo_tasks').update({ done }).eq('id', id);
    if (error) setCeoError(error.message);
  }

  async function removeCeoTask(id: string) {
    const { error } = await supabase.from('ceo_tasks').delete().eq('id', id);
    if (error) setCeoError(error.message);
  }

  function PriorityBadge({ value }: { value: string | null }) {
    const styles =
      value === 'High'
        ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
        : value === 'Medium'
          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
          : value === 'Low'
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
        {value ?? '---'}
      </span>
    );
  }

  const visibleCeoTasks = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return (ceoTasks ?? []).filter((t) => {
      if (!t.done) return true;
      if (!t.completed_at) return true;
      return now - new Date(t.completed_at).getTime() <= dayMs;
    });
  }, [ceoTasks]);

  const visibleCeo = ceoExpanded ? visibleCeoTasks : visibleCeoTasks.slice(0, DEFAULT_LIMIT);
  const hiddenCeoCount = Math.max(visibleCeoTasks.length - visibleCeo.length, 0);

  const sortedNotion = useMemo(
    () => (notionTasks ? [...notionTasks].sort(massiveCustomSort) : []),
    [notionTasks]
  );

  const visibleNotion = notionExpanded ? sortedNotion ?? [] : (sortedNotion ?? []).slice(0, DEFAULT_LIMIT);
  const hiddenNotionCount = Math.max((sortedNotion?.length || 0) - visibleNotion.length, 0);

  return (
    <section className="grid gap-6">
      {/* CEO's Tasks */}
      <div className="overflow-hidden rounded-xl border border-border-light bg-surface shadow-sm">
        <div className="border-b border-border-light bg-gradient-to-r from-primary-dark to-primary px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">CEO&apos;s Tasks</h2>
            {ceoError && (
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs text-red-100">
                Error: {ceoError}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <form onSubmit={addCeoTask} className="mb-4 flex gap-2">
            <input
              name="title"
              type="text"
              placeholder="Add a task for CEO..."
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              Add
            </button>
          </form>

          {!visibleCeoTasks && !ceoError && (
            <p className="py-3 text-center text-sm text-text-muted">Loading...</p>
          )}

          <ul className="divide-y divide-border-light">
            {visibleCeo.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3 group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => toggleCeoTask(t.id, e.currentTarget.checked)}
                      className="h-[18px] w-[18px] rounded-md border-2 border-border text-primary accent-primary transition-colors focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <span className={`text-sm leading-relaxed ${t.done ? 'text-text-muted line-through' : 'text-foreground'}`}>
                    {t.title}
                  </span>
                </label>
                <button
                  onClick={() => removeCeoTask(t.id)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-text-muted opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                >
                  Remove
                </button>
              </li>
            ))}
            {visibleCeoTasks?.length === 0 && (
              <li className="py-4 text-center text-sm text-text-muted">No tasks yet.</li>
            )}
          </ul>

          {(hiddenCeoCount > 0 || ceoExpanded) && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <button
                onClick={() => setCeoExpanded((v) => !v)}
                className="text-xs font-medium text-primary hover:text-primary-dark hover:underline"
              >
                {ceoExpanded ? 'Show less' : `Show ${hiddenCeoCount} more`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Web Dev Tasks (Notion) */}
      <div className="overflow-hidden rounded-xl border border-border-light bg-surface shadow-sm">
        <div className="border-b border-border-light bg-gradient-to-r from-amber-800 to-amber-600 px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Web Dev Tasks (Notion)</h2>
            {notionError && (
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs text-red-100">
                Error: {notionError}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {!notionError && !notionTasks && (
            <p className="py-3 text-center text-sm text-text-muted">Loading...</p>
          )}
          {!notionError && notionTasks?.length === 0 && (
            <p className="py-3 text-center text-sm text-text-muted">No tasks found.</p>
          )}

          <ul className="divide-y divide-border-light">
            {visibleNotion.map((t) => (
              <li key={t.id} className="py-3 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-foreground">{t.task}</span>
                    {t.contentName && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {t.contentName}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                          t.status === 'Done' ? 'bg-emerald-500' :
                          t.status === 'In progress' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`} />
                        {t.status || '---'}
                      </span>
                      {t.goalDate && (
                        <span className="ml-2 text-text-muted">
                          {new Date(t.goalDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <PriorityBadge value={t.priority} />
                    <select
                      value={t.priority ?? ''}
                      onChange={async (e) => {
                        const next = e.currentTarget.value || null;
                        setNotionTasks((cur) =>
                          cur?.map((nt) => (nt.id === t.id ? { ...nt, priority: next } : nt)) ?? null
                        );
                        await fetch('/api/notion/update-priority', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: t.id, priority: next }),
                        }).catch(() => {});
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-text-secondary outline-none transition-colors focus:border-primary"
                    >
                      <option value="">---</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {(hiddenNotionCount > 0 || notionExpanded) && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <button
                onClick={() => setNotionExpanded((v) => !v)}
                className="text-xs font-medium text-primary hover:text-primary-dark hover:underline"
              >
                {notionExpanded ? 'Show less' : `Show ${hiddenNotionCount} more`}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
