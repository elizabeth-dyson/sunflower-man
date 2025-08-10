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

// type Seed = { id: string; name: string; type: string | null };

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

  // // Seeds (real from Supabase) – kept if you use elsewhere on page
  // const [seeds, setSeeds] = useState<Seed[] | null>(null);
  // const [seedError, setSeedError] = useState<string | null>(null);

  // CEO tasks (Supabase)
  const [ceoTasks, setCeoTasks] = useState<CeoTask[] | null>(null);
  const [ceoError, setCeoError] = useState<string | null>(null);
  const [ceoExpanded, setCeoExpanded] = useState(false);

  // Notion tasks
  const [notionTasks, setNotionTasks] = useState<NotionTask[] | null>(null);
  const [notionError, setNotionError] = useState<string | null>(null);
  const [notionExpanded, setNotionExpanded] = useState(false);

  // --- helpers (top of TaskCenter.tsx) ---
  const priorityRank = (p?: string | null) =>
    p === 'High' ? 0 : p === 'Medium' ? 1 : p === 'Low' ? 2 : 3; // unknowns last

  // Sort helpers for Notion tasks
  const massiveCustomSort = (a: NotionTask, b: NotionTask) => {
    // Goal Date ascending; nulls last
    const ad = a.goalDate ? new Date(a.goalDate).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.goalDate ? new Date(b.goalDate).getTime() : Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;

    // Priority High -> Low
    const ap = priorityRank(a.priority);
    const bp = priorityRank(b.priority);
    if (ap !== bp) return ap - bp;

    // contentName: A→Z; null/empty go last
    const ac = (a.contentName ?? '\uFFFF').toLocaleLowerCase();
    const bc = (b.contentName ?? '\uFFFF').toLocaleLowerCase();
    if (ac !== bc) return ac.localeCompare(bc);

    // within a content group: task title A→Z (case-insensitive)
    const at = (a.task ?? '').toLocaleLowerCase();
    const bt = (b.task ?? '').toLocaleLowerCase();
    if (at !== bt) return at.localeCompare(bt);

    // Stable-ish fallback by title
    return (a.task || '').localeCompare(b.task || '');
  };

  // // Load Seeds
  // useEffect(() => {
  //   (async () => {
  //     setSeedError(null);
  //     const { data, error } = await supabase
  //       .from('seeds')
  //       .select('id,name,type')
  //       .order('name', { ascending: true });
  //     if (error) setSeedError(error.message);
  //     else setSeeds(data as Seed[]);
  //   })();
  // }, [supabase]);

  // Load CEO tasks + realtime
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

  // Notion fetch
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
    const cls =
      value === 'High'   ? 'bg-red-100 text-red-800' :
      value === 'Medium' ? 'bg-amber-100 text-amber-800' :
      value === 'Low'    ? 'bg-green-100 text-green-800' :
      'bg-gray-100 text-gray-600';
    return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{value ?? '—'}</span>;
  }

  // ---------- Visibility: hide done tasks after 24h ----------
  const visibleCeoTasks = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return (ceoTasks ?? []).filter((t) => {
      if (!t.done) return true;                 // always show not-done
      if (!t.completed_at) return true;         // safety for older rows
      return now - new Date(t.completed_at).getTime() <= dayMs; // hide if older than 24h
    });
  }, [ceoTasks]);

  // paginate from the filtered list
  const visibleCeo = ceoExpanded ? visibleCeoTasks : visibleCeoTasks.slice(0, DEFAULT_LIMIT);
  const hiddenCeoCount = Math.max(visibleCeoTasks.length - visibleCeo.length, 0);

  const sortedNotion = useMemo(
    () => (notionTasks ? [...notionTasks].sort(massiveCustomSort) : []),
    [notionTasks]
  );

  const visibleNotion = notionExpanded ? sortedNotion ?? [] : (sortedNotion ?? []).slice(0, DEFAULT_LIMIT);
  const hiddenNotionCount = Math.max((sortedNotion?.length || 0) - visibleNotion.length, 0);

  return (
    <section className="mx-auto grid max-w-5xl gap-8 px-4 pb-12">
      {/* CEO's Tasks (Supabase, shared) */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">CEO’s Tasks</h2>
          {ceoError && <span className="text-xs text-red-700">Error: {ceoError}</span>}
        </div>

        <form onSubmit={addCeoTask} className="mb-3 flex gap-2">
          <input
            name="title"
            type="text"
            placeholder="Add a task for CEO…"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
            required
          />
          <button
            type="submit"
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Add
          </button>
        </form>

        {!visibleCeoTasks && !ceoError && <p className="text-sm text-gray-500">Loading…</p>}

        <ul className="divide-y">
          {visibleCeo.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => toggleCeoTask(t.id, e.currentTarget.checked)}
                  className="size-4 accent-green-700"
                />
                <span className={t.done ? 'text-gray-400 line-through' : 'text-gray-800'}>
                  {t.title}
                </span>
              </label>
              <button
                onClick={() => removeCeoTask(t.id)}
                className="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
          {visibleCeoTasks?.length === 0 && <li className="py-2 text-sm text-gray-500">No tasks yet.</li>}
        </ul>

        {(hiddenCeoCount > 0 || ceoExpanded) && (
          <div className="mt-2">
            <button
              onClick={() => setCeoExpanded((v) => !v)}
              className="text-xs text-green-800 hover:underline"
            >
              {ceoExpanded ? 'Show less' : `Show more (${hiddenCeoCount})`}
            </button>
          </div>
        )}
      </div>

      {/* Web Dev Tasks (Notion) */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Web Dev Tasks (Notion)</h2>
          {notionError && (
            <span className="text-xs text-red-700">
              Error: {notionError}
            </span>
          )}
        </div>

        {!notionError && !notionTasks && <p className="text-sm text-gray-500">Loading…</p>}
        {!notionError && notionTasks?.length === 0 && (
          <p className="text-sm text-gray-500">No tasks found.</p>
        )}

        <ul className="divide-y">
          {visibleNotion.map((t) => (
            <li key={t.id} className="py-2">
              <div className="flex items-center justify-between gap-4">
                {/* LEFT: Task | Content Name */}
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900">{t.task}</span>
                  {t.contentName && <span className="text-gray-500"> | {t.contentName}</span>}
                </div>

                {/* RIGHT: Status • Goal Date */}
                <div className="shrink-0 text-xs text-gray-500 text-right">
                  <span>{t.status ? `Status: ${t.status}` : 'Status: —'}</span>
                  {t.goalDate && <span> • Goal Date: {new Date(t.goalDate).toLocaleDateString()}</span>}
                </div>
                <div className="shrink-0 text-xs text-right flex items-center gap-2">
                  <PriorityBadge value={t.priority} />
                  <select
                    value={t.priority ?? ''}
                    onChange={async (e) => {
                      const next = e.currentTarget.value || null;

                      // optimistic local update (the memo will re-sort)
                      setNotionTasks((cur) =>
                        cur?.map((nt) => (nt.id === t.id ? { ...nt, priority: next } : nt)) ?? null
                      );

                      // persist to Notion (errors can roll back if you want)
                      await fetch('/api/notion/update-priority', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: t.id, priority: next }),
                      }).catch(() => {
                        // optional rollback:
                        // setNotionTasks(cur => cur?.map(nt => nt.id===t.id ? {...nt, priority: t.priority} : nt) ?? null);
                      });
                    }}
                    className="rounded border px-1 py-0.5 text-xs"
                  >
                    <option value="">—</option>
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
          <div className="mt-2">
            <button
              onClick={() => setNotionExpanded((v) => !v)}
              className="text-xs text-green-800 hover:underline"
            >
              {notionExpanded ? 'Show less' : `Show more (${hiddenNotionCount})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}