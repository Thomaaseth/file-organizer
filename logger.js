const pino = require ('pino');

const logger = pino({
    level: 'info',
    transport: {
        targets: [
        { target: 'pino-pretty', options: { destination: 1 } },
        { target: 'pino/file', options: { destination: 'file-organizer.log'} }
    ]
    }
});

module.exports = logger;