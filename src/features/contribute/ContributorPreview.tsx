import { AlertTriangle, ArrowLeft, CheckCircle2, Download, PackageCheck, Upload } from "lucide-react";
import { useState } from "react";
import { inspectTopicPackArchive, type TopicPackIntake } from "../../packs/intake";
import { useTopicLibrary } from "../../packs/libraryContext";
import { PACK_LIMITS } from "../../packs/validator";
import { Brand } from "../../ui/Brand";
import { TopicArtwork } from "../../ui/TopicArtwork";

export default function ContributorPreview() {
  const { install } = useTopicLibrary();
  const [result, setResult] = useState<TopicPackIntake | null>(null);
  const [selected, setSelected] = useState(0);
  const [locale, setLocale] = useState<"EN" | "PL" | "JA">("EN");
  const [installed, setInstalled] = useState(false);
  const [installError, setInstallError] = useState("");
  const topics = result?.accepted?.topics ?? [];
  const topic = topics[selected] ?? topics[0];
  const validation = result?.validation;
  const accepted = result?.accepted;

  async function inspect(file: File) {
    setInstalled(false);
    setInstallError("");
    setSelected(0);
    if (file.size > PACK_LIMITS.archiveBytes) {
      setResult({ validation: { valid: false, issues: [{ severity: "error", code: "archive.size", path: "archive", message: "The archive exceeds 25 MiB." }] } });
      return;
    }
    const next = inspectTopicPackArchive(new Uint8Array(await file.arrayBuffer()));
    setResult(next);
    if (next.accepted) setLocale(next.accepted.record.manifest.defaultLocale);
  }

  return <div className="contributor-workspace">
    <header className="contributor-header"><a href="/" aria-label="LinguaFlow home"><Brand /></a><a className="text-button" href="/app/"><ArrowLeft size={17} /> Workspace</a></header>
    <main className="contributor-main">
      <header><p className="eyebrow"><PackageCheck size={18} /> Contributor preview</p><h1>Validate a topic pack before you share it</h1><p>This public, account-free workspace checks the portable archive and shows the learner, teacher, provenance, and print content LinguaFlow will use.</p></header>
      <label className="pack-dropzone"><Upload size={28} /><strong>Choose a .lfpack archive</strong><span>ZIP-based, maximum 25 MiB. Files stay in this browser unless you install the pack.</span><input type="file" accept=".lfpack,application/zip" onChange={(event) => event.target.files?.[0] && void inspect(event.target.files[0])} /></label>
      {validation ? <section className={`validation-summary ${validation.valid ? "is-valid" : "is-invalid"}`} aria-live="polite"><h2>{validation.valid ? <CheckCircle2 /> : <AlertTriangle />}{validation.valid ? "Pack is valid" : "Pack needs changes"}</h2>{validation.issues.length ? <ul>{validation.issues.map((item, index) => <li key={`${item.code}-${index}`}><strong>{item.severity}: {item.code}</strong><code>{item.path}</code><span>{item.message}</span></li>)}</ul> : <p>No issues found.</p>}</section> : null}
      {accepted && topic ? <>
        <section className="preview-toolbar"><div><strong>{accepted.record.manifest.title[accepted.record.manifest.defaultLocale]}</strong><span>{accepted.record.manifest.id}@{accepted.record.manifest.version} · {accepted.document.topics.length} topics</span></div><div className="locale-tabs" role="group" aria-label="Preview language">{accepted.record.manifest.locales.map((item) => <button className={locale === item ? "active" : ""} aria-pressed={locale === item} type="button" key={item} onClick={() => setLocale(item)}>{item}</button>)}</div><button className="primary-button" type="button" disabled={installed} onClick={async () => { try { setInstallError(""); await install(accepted); setInstalled(true); } catch { setInstallError("The pack could not be installed in this browser."); } }}>{installed ? "Installed" : <><Download size={17} /> Install locally</>}</button></section>
        {installError ? <p className="validation-errors" role="alert">{installError}</p> : null}
        <div className="contributor-preview-grid"><aside aria-label="Topics in pack">{topics.map((item, index) => <button className={index === selected ? "selected" : ""} aria-pressed={index === selected} type="button" key={item.id} onClick={() => setSelected(index)}><TopicArtwork topic={item} locale={locale} /><span><strong>{item.title[locale]}</strong><small>{item.level} · {item.category}</small></span></button>)}</aside><article className="lesson-sheet"><TopicArtwork topic={topic} locale={locale} large /><p className="eyebrow">{topic.category} · {topic.level}</p><h2>{topic.title[locale]}</h2><p>{topic.description[locale]}</p><h3>Main prompt</h3><p className="main-prompt-print">{topic.mainPrompt[locale]}</p><h3>Follow-up questions</h3><ol>{topic.followUps[locale].map((question) => <li key={question}>{question}</li>)}</ol><h3>Teacher facilitation</h3><p><strong>{topic.facilitation!.durationMinutes.min}–{topic.facilitation!.durationMinutes.max} min · {topic.facilitation!.groupSize.min}–{topic.facilitation!.groupSize.max} people</strong></p><p>{topic.facilitation!.preparation[locale]}</p><ul>{topic.facilitation!.tips[locale].map((tip) => <li key={tip}>{tip}</li>)}</ul><h3>Authorship and provenance</h3><p>{topic.provenance!.authors.map((author) => author.displayName).join(", ")} · {topic.provenance!.license} · {topic.provenance!.reviews.length ? `${topic.provenance!.reviews.length} review assertions` : "Unreviewed"}</p><button className="secondary-button no-print" type="button" onClick={() => window.print()}>Print lesson</button></article></div>
      </> : null}
    </main>
  </div>;
}
