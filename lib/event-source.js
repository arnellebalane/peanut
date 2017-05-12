const subscribers = {};

function subscribe(client) {
    const token = (new Date()).getTime();
    subscribers[token] = client;

    client.set('Content-Type', 'text/event-stream');
    client.set('Cache-Control', 'no-cache');
    client.set('Connection', 'keep-alive');

    client.on('close', () => unsubscribe(token));

    return token;
}

function unsubscribe(token, ended) {
    subscribers[token].end();
    delete subscribers[token];
}

function message(token, data) {
    subscribers[token].write(format(data));
}

function format(data) {
    return Object.keys(data).reduce((message, key) => {
        const value = typeof data[key] === 'string'
            ? data[key]
            : JSON.stringify(data[key]);
        return message + `${key}: ${value}\n`;
    }, '') + '\n';
}

exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.message = message;
