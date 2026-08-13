// Maintainers approve bundled packs through normal code review. Keeping the
// glob here makes adding one a data-only change while preserving validation.
const modules = import.meta.glob("./bundled/*.lfpack", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const bundledPackUrls = Object.values(modules);
