module.exports = {
    apps: [{
      name: 'mi-aplicacion',
      script: 'index.js',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      exp_backoff_restart_delay: 100
    }]
  };
  