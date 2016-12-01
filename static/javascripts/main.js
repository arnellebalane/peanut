(function() {
    let token;


    const subscribeToServerSentEvents = _ => {
        const server = new EventSource('/eventsource');

        server.addEventListener('subscribe', e => token = e.data);
    };


    subscribeToServerSentEvents();
})();
