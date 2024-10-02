const pino = require('pino');

const logger = pino({
    level: 'trace',
    transport: {
        targets: [
            {
                target: 'pino-pretty',
                options: {
                    destination: 1,
                    sync: true,
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname',
                    colorize: true,
                }
            },
        ]
    }
});

module.exports = logger;
