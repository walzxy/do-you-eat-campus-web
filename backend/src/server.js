const app = require('./app');
const { config } = require('./config');

app.listen(config.port, () => {
  console.log('[INFO] Server started');
  console.log('[INFO] Port: ' + config.port);
  console.log('[INFO] Environment: ' + config.nodeEnv);
});

