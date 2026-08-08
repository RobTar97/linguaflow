import { AlertTriangle, ArrowLeft, CheckCircle2, Download, PackageCheck, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { readTopicPackArchive } from "../../packs/archive";
import { useTopicLibrary } from "../../packs/libraryContext";
import { installedRecord, topicsFromInstalledPack } from "../../packs/normalize";
import type { TopicPackValidationResult } from "../../packs/types";
import { Brand } from "../../ui/Brand";
import { TopicArtwork } from "../../ui/TopicArtwork";

export default function ContributorPreview() {
  const { install } = useTopicLibrary();
  const [result, setResult] = useState<TopicPackValidationResult | null>(null);
  const [selected, setSelected] = useState(0);
  const [locale, setLocale] = useState<"EN" | "PL" | "JA">("EN");
  const [installed, setInstalled] = useState(false);
  const topics = useMemo(() => result?.pack ? topicsFromInstalledPack(installedRecord(result.pack)) : [], [result]);
  const topic = topics[selected] ?? topics[0];

  async function inspect(file: File) {
    setInstalled(false);
    setSelected(0);
    const next = readTopicPackArchive(new Uint8Array(await file.arrayBuffer()));
    setResult(next);
    if (next.pack) setLocale(next.pack.manifest.defaultLocale);
  }

  return <div className="contributor-workspace">
    <header className="contributor-header"><a href="/" aria-label="LinguaFlow home"><Brand /></a><a className="text-button" href="/app/"><ArrowLeft size={17} /> Workspace</a></header>
    <main className="contributor-main">
      <header><p className="eyebrow"><PackageCheck size={18} /> Contributor preview</p><h1>Validate a topic pack before you share it</h1><p>This public, account-free workspace checks the portable archive and shows the learner, teacher, provenance, and print content LinguaFlow will use.</p></header>
      <label className="pack-dropzone"><Upload size={28} /><strong>Choose a .lfpack archive</strong><span>ZIP-based, maximum 25 MiB. Files stay in this browser unless you install the pack.</span><input type="file" accept=".lfpack,application/zip" onChange={(event) => event.target.files?.[0] && void inspect(event.target.files[0])} /></label>
      {result ? <section className={`validation-summary ${result.valid ? "is-valid" : "is-invalid"}`}><h2>{result.valid ? <CheckCircle2 /> : <AlertTriangle />}{result.valid ? "Pack is valid" : "Pack needs changes"}</h2>{result.issues.length ? <ul>{result.issues.map((item, index) => <li key={`${item.code}-${index}`}><strong>{item.severity}: {item.code}</strong><code>{item.path}</code><span>{item.message}</span></li>)}</ul> : <p>No issues found.</p>}</section> : null}
      {result?.pack && topic ? <>
        <section className="preview-toolbar"><div><strong>{result.pack.manifest.title[result.pack.manifest.defaultLocale]}</strong><span>{result.pack.manifest.id}@{result.pack.manifest.version} · {result.pack.topics.length} topics</span></div><div className="locale-tabs">{result.pack.manifest.locales.map((item) => <button className={locale === item ? "active" : ""} type="button" key={item} onClick={() => setLocale(item)}>{item}</button>)}</div><button className="primary-button" type="button" disabled={installed} onClick={async () => { await install(result.pack!); setInstalled(true); }}>{installed ? "Installed" : <><Download size={17} /> Install locally</>}</button></section>
        <div className="contributor-preview-grid"><aside>{topics.map((item, index) => <button className={index === selected ? "selected" : ""} type="button" key={item.id} onClick={() => setSelected(index)}><TopicArtwork topic={item} locale={locale} /><span><strong>{item.title[locale]}</strong><small>{item.level} · {item.category}</small></span></button>)}</aside><article className="lesson-sheet"><TopicArtwork topic={topic} locale={locale} large /><p className="eyebrow">{topic.category} · {topic.level}</p><h2>{topic.title[locale]}</h2><p>{topic.description[locale]}</p><h3>Main prompt</h3><p className="main-prompt-print">{topic.mainPrompt[locale]}</p><h3>Follow-up questions</h3><ol>{topic.followUps[locale].map((question) => <li key={question}>{question}</li>)}</ol><h3>Teacher facilitation</h3><p><strong>{topic.facilitation!.durationMinutes.min}–{topic.facilitation!.durationMinutes.max} min · {topic.facilitation!.groupSize.min}–{topic.facilitation!.groupSize.max} people</strong></p><p>{topic.facilitation!.preparation[locale]}</p><ul>{topic.facilitation!.tips[locale].map((tip) => <li key={tip}>{tip}</li>)}</ul><h3>Authorship and provenance</h3><p>{topic.provenance!.authors.map((author) => author.displayName).join(", ")} · {topic.provenance!.license} · {topic.provenance!.reviews.length ? `${topic.provenance!.reviews.length} review assertions` : "Unreviewed"}</p><button className="secondary-button no-print" type="button" onClick={() => window.print()}>Print lesson</button></article></div>
      </> : null}
    </main>
  </div>;
}
