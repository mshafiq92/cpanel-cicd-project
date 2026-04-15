// ── Dashboard Live Updater ──────────────────────────────────────────────────

const $ = id => document.getElementById(id);

// Format uptime seconds into human-readable string
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Format ISO date into readable local time
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// Time ago from ISO string
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ── Fetch and render stats ──────────────────────────────────────────────────
let uptimeBase = 0;
let uptimeInterval = null;

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();

    // Status
    const statusEl = $('stat-status');
    statusEl.innerHTML = `<span class="dot green pulse"></span> Online`;
    statusEl.className = 'stat-value green';

    // Version
    $('stat-version').textContent = `v${data.version}`;

    // Environment
    $('stat-env').textContent = data.environment;

    // Node version
    $('stat-node').textContent = data.node;

    // Memory
    $('stat-memory').textContent = data.memory.used;
    $('stat-memory-sub').textContent = `of ${data.memory.total} heap`;

    // Platform
    $('stat-platform').textContent = data.platform;

    // Last deployed
    $('stat-deployed').textContent = formatDate(data.deployedAt);

    // Uptime — sync with server then tick locally
    uptimeBase = data.uptime;
    clearInterval(uptimeInterval);
    uptimeInterval = setInterval(() => {
      uptimeBase += 1;
      const el = $('stat-uptime');
      if (el) el.textContent = formatUptime(uptimeBase);
    }, 1000);

  } catch (err) {
    const statusEl = $('stat-status');
    if (statusEl) {
      statusEl.innerHTML = `<span class="dot red"></span> Offline`;
      statusEl.className = 'stat-value';
      statusEl.style.color = 'var(--red)';
    }
    console.error('Stats fetch error:', err);
  }
}

// ── Fetch and render deployment history ────────────────────────────────────
async function fetchDeployments() {
  try {
    const res = await fetch('/api/deployments');
    const data = await res.json();
    const list = $('deploy-list');
    if (!list) return;

    if (!data.length) {
      list.innerHTML = '<div class="deploy-item"><p style="color:var(--muted)">No deployments yet.</p></div>';
      return;
    }

    list.innerHTML = data.map(d => `
      <div class="deploy-item">
        <div class="deploy-dot ${d.status === 'success' ? 'success' : 'failed'}"></div>
        <div class="deploy-info">
          <div class="deploy-version">v${d.version}</div>
          <div class="deploy-msg">${d.message}</div>
          <div class="deploy-time">${formatDate(d.deployedAt)} · ${timeAgo(d.deployedAt)}</div>
        </div>
      </div>
    `).join('');

    $('deploy-count').textContent = data.length;

  } catch (err) {
    console.error('Deployments fetch error:', err);
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchDeployments();

  // Refresh stats every 5 seconds
  setInterval(fetchStats, 5000);

  // Refresh deployment list every 30 seconds
  setInterval(fetchDeployments, 30000);
});
