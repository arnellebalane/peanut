(function() {
    let token;


    const subscribeToServerSentEvents = url => {
        const server = new EventSource(url);

        server.addEventListener('subscribe', e => token = e.data);
    };


    subscribeToServerSentEvents('/eventsource');
})();
