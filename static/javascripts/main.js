const server = new EventSource('/eventsource');
let token;

server.addEventListener('open', e => {
    console.info('EventSource connection to server opened');
});

server.addEventListener('subscribe', e => {
    console.info('Subscribed to server-sent events');
    token = e.data;
});
