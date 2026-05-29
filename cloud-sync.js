const SYNC_OVERRIDE_KEY = "translation-intern-manager-sync-override";

function loadSyncOverride() {
  try {
    const raw = localStorage.getItem(SYNC_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSyncOverride(config) {
  localStorage.setItem(
    SYNC_OVERRIDE_KEY,
    JSON.stringify({
      url: config.url,
      anonKey: config.anonKey,
      workspaceId: config.workspaceId || "translation-intern-ops",
    }),
  );
}

function clearSyncOverride() {
  localStorage.removeItem(SYNC_OVERRIDE_KEY);
}

function encodeSyncSetupCode(config) {
  return b64Url(new TextEncoder().encode(JSON.stringify(config)));
}

function decodeSyncSetupCode(code) {
  const text = new TextDecoder().decode(fromB64Url(code.trim()));
  const parsed = JSON.parse(text);
  if (!parsed?.url || !parsed?.anonKey) throw new Error("invalid_code");
  return {
    url: String(parsed.url).trim(),
    anonKey: String(parsed.anonKey).trim(),
    workspaceId: String(parsed.workspaceId || "translation-intern-ops").trim(),
  };
}

function b64Url(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64Url(code) {
  const normalized = code.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getSyncConfig() {
  const override = loadSyncOverride();
  if (override?.url && override?.anonKey) {
    return {
      enabled: true,
      url: override.url,
      anonKey: override.anonKey,
      workspaceId: override.workspaceId || "translation-intern-ops",
    };
  }
  const base = typeof SYNC_CONFIG !== "undefined" ? SYNC_CONFIG : {};
  if (base.enabled && base.url && base.anonKey) return base;
  return {
    enabled: false,
    url: base.url || "",
    anonKey: base.anonKey || "",
    workspaceId: base.workspaceId || "translation-intern-ops",
  };
}

const CloudSync = {
  isEnabled() {
    const config = getSyncConfig();
    return Boolean(config.enabled && config.url && config.anonKey);
  },

  workspaceId() {
    return getSyncConfig().workspaceId || "default";
  },

  headers(prefer) {
    const config = getSyncConfig();
    const headers = {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
    };
    if (prefer) headers.Prefer = prefer;
    return headers;
  },

  tableUrl() {
    const config = getSyncConfig();
    return `${config.url.replace(/\/$/, "")}/rest/v1/workspaces`;
  },

  async ping() {
    if (!this.isEnabled()) return false;
    try {
      const res = await fetch(`${this.tableUrl()}?select=id&limit=1`, { headers: this.headers() });
      return res.ok;
    } catch {
      return false;
    }
  },

  async fetchRow() {
    if (!this.isEnabled()) return null;
    const res = await fetch(`${this.tableUrl()}?id=eq.${encodeURIComponent(this.workspaceId())}&select=*`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`cloud_fetch_${res.status}`);
    const rows = await res.json();
    return rows[0] ?? null;
  },

  async upsertRow(payload) {
    if (!this.isEnabled()) return null;
    const updatedAt = new Date().toISOString();
    const existing = await this.fetchRow().catch(() => null);
    if (existing) {
      const res = await fetch(`${this.tableUrl()}?id=eq.${encodeURIComponent(this.workspaceId())}`, {
        method: "PATCH",
        headers: this.headers("return=representation"),
        body: JSON.stringify({ ...payload, updated_at: updatedAt }),
      });
      if (!res.ok) throw new Error(`cloud_patch_${res.status}`);
      const rows = await res.json();
      return rows[0]?.updated_at ?? updatedAt;
    }
    const res = await fetch(this.tableUrl(), {
      method: "POST",
      headers: this.headers("return=representation"),
      body: JSON.stringify({ id: this.workspaceId(), ...payload, updated_at: updatedAt }),
    });
    if (!res.ok) throw new Error(`cloud_post_${res.status}`);
    const rows = await res.json();
    return rows[0]?.updated_at ?? updatedAt;
  },

  async saveVerifier(verifier) {
    return this.upsertRow({ verifier });
  },

  async saveVaultEnvelope(envelope) {
    return this.upsertRow({ vault: envelope });
  },
};
