export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[36px] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold">Platform health and configuration</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white/70 p-5 dark:bg-slate-900/45">
            <p className="text-sm font-semibold">AI services</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Groq is configured through local env files only. The tracked Docker config no longer contains hardcoded secrets.
            </p>
          </div>
          <div className="rounded-3xl bg-white/70 p-5 dark:bg-slate-900/45">
            <p className="text-sm font-semibold">Navigation cleanup</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              The main navigation now stays focused on Dashboard, Analytics, Goals, Reports, and Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
