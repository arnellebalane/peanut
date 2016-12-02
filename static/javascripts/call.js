(function() {
    let token;


    const subscribeToServerSentEvents = _ => {
        const server = new EventSource(location.pathname);

        server.addEventListener('joinedroom', e => token = e.data);
    };


    subscribeToServerSentEvents();
})();
