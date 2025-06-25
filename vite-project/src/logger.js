function logEvent(event) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${event}\n`;
  fs.appendFileSync('logs/app.log', logLine);
}

module.exports = logEvent;