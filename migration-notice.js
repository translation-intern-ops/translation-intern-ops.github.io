const MIGRATION_SITE_URL =
  "http://translation-intern-ops-pre-vibe-zlf-11097.prelb-7.matrix-app.meitu-int.com/";
const MIGRATION_DISMISS_KEY = "translation-intern-ops-migration-notice-dismissed";

function isGithubPagesHost() {
  const host = window.location.hostname.toLowerCase();
  if (host === "translation-intern-ops.github.io") return true;
  if (host.endsWith(".github.io") && host.includes("translation-intern")) return true;
  return /\.github\.io$/i.test(host) && document.title.includes("翻译实习生");
}

function shouldShowMigrationNotice() {
  if (!isGithubPagesHost()) return false;
  try {
    return sessionStorage.getItem(MIGRATION_DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

function openMigrationNotice() {
  const modal = document.getElementById("migrationNoticeModal");
  if (!modal) return;
  modal.classList.remove("hidden");
}

function closeMigrationNotice(persist = true) {
  const modal = document.getElementById("migrationNoticeModal");
  if (!modal) return;
  modal.classList.add("hidden");
  if (persist) {
    try {
      sessionStorage.setItem(MIGRATION_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }
}

function initMigrationNotice() {
  if (!shouldShowMigrationNotice()) return;
  openMigrationNotice();
  document.getElementById("migrationNoticeGoBtn")?.addEventListener("click", () => {
    window.location.href = MIGRATION_SITE_URL;
  });
  document.getElementById("dismissMigrationNotice")?.addEventListener("click", () => {
    closeMigrationNotice(true);
  });
  document.getElementById("migrationNoticeModal")?.addEventListener("click", (event) => {
    if (event.target.id === "migrationNoticeModal") closeMigrationNotice(true);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMigrationNotice);
} else {
  initMigrationNotice();
}
