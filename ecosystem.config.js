module.exports = {
  apps: [{
    // ── App Identity ────────────────────────────────
    name: 'app',
    script: 'src/index.js',

    // ── Instances & Mode ────────────────────────────
    instances: 1,
    exec_mode: 'fork',

    // ── Restart Behavior ────────────────────────────
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '5s',
    restart_delay: 3000,
    max_memory_restart: '200M',

    // ── Environment ─────────────────────────────────
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // ── Logging ─────────────────────────────────────
    error_file: '/home/apexiybi/.pm2/logs/app-error.log',
    out_file: '/home/apexiybi/.pm2/logs/app-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
