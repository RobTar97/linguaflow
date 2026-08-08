import { ArrowLeft, CheckCircle2, Download, FileJson, Upload } from "lucide-react";
import { useState } from "react";
import { useTopicLibrary } from "../../packs/libraryContext";
import { LEARNER_DATA_SCHEMA_VERSION, parseLearnerData, type LearnerDataExport } from "../../learnerData/format";
import { WorkspaceHeader } from "../../ui/WorkspaceHeader";
import { useLearningWorkspace } from "../../workspace/context";

export default function LearnerDataManager() {
  const workspace = useLearningWorkspace();
  const { packs } = useTopicLibrary();
  const [pending, setPending] = useState<LearnerDataExport | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [replaceProfile, setReplaceProfile] = useState(false);
  const [replaceConflicts, setReplaceConflicts] = useState(false);
  const [complete, setComplete] = useState(false);

  function downloadExport() {
    const data: LearnerDataExport = {
      schemaVersion: LEARNER_DATA_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: __APP_VERSION__,
      ...(workspace.profile ? { profile: workspace.profile } : {}),
      library: {
        savedTopicIds: workspace.savedIds,
        topicNotes: workspace.topicNotes,
        vocabularyBookmarks: workspace.vocabularyBookmarks,
      },
      installedPacks: packs.map(({ manifest }) => ({ id: manifest.id, version: manifest.version })),
    };
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `linguaflow-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function inspect(file: File) {
    setComplete(false);
    try {
      const parsed = parseLearnerData(JSON.parse(await file.text()));
      setErrors(parsed.errors);
      setPending(parsed.data ?? null);
    } catch {
      setErrors(["The selected file is not valid JSON."]);
      setPending(null);
    }
  }

  function merge() {
    if (!pending) return;
    workspace.importLearnerLibrary({
      savedIds: pending.library.savedTopicIds,
      topicNotes: pending.library.topicNotes,
      vocabularyBookmarks: pending.library.vocabularyBookmarks,
      profile: pending.profile,
      replaceProfile,
      replaceConflicts,
    });
    setPending(null);
    setComplete(true);
  }

  return <div className="workspace-page">
    <WorkspaceHeader />
    <main className="data-manager compact-workspace">
      <button className="text-button" type="button" onClick={() => workspace.navigate("explore")}><ArrowLeft size={17} /> Back to practice</button>
      <header><p className="eyebrow"><FileJson size={17} /> Learner-owned data</p><h1>Take your learning library with you</h1><p>Export or merge your profile, goals, saved topics, private notes, vocabulary bookmarks, and installed-pack references. Room history and access tokens are never included.</p></header>
      <div className="data-action-grid">
        <section><Download size={24} /><h2>Export this device</h2><p>Create a readable, versioned JSON file you control.</p><button className="primary-button" type="button" onClick={downloadExport}>Download my data</button></section>
        <section><Upload size={24} /><h2>Import from a file</h2><p>LinguaFlow previews the contents before changing this device.</p><label className="secondary-button file-button">Choose data file<input type="file" accept="application/json,.json" onChange={(event) => event.target.files?.[0] && void inspect(event.target.files[0])} /></label></section>
      </div>
      {errors.length ? <div className="validation-errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
      {pending ? <section className="import-preview"><h2>Import preview</h2><dl><div><dt>Saved topics</dt><dd>{pending.library.savedTopicIds.length}</dd></div><div><dt>Private notes</dt><dd>{Object.keys(pending.library.topicNotes).length}</dd></div><div><dt>Vocabulary</dt><dd>{pending.library.vocabularyBookmarks.length}</dd></div><div><dt>Pack references</dt><dd>{pending.installedPacks.length}</dd></div></dl><label><input type="checkbox" checked={replaceConflicts} onChange={(event) => setReplaceConflicts(event.target.checked)} /> Use imported notes when both files contain the same topic</label>{pending.profile ? <label><input type="checkbox" checked={replaceProfile} onChange={(event) => setReplaceProfile(event.target.checked)} /> Replace this device’s profile and language goal</label> : null}<button className="primary-button" type="button" onClick={merge}>Merge imported data</button></section> : null}
      {complete ? <p className="success-message" role="status"><CheckCircle2 size={18} /> Import complete.</p> : null}
    </main>
  </div>;
}
