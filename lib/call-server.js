const eventsource = require('./event-source');


const rooms = {};


function createRoom() {
    const room = (new Date()).getTime();
    rooms[room] = { participants: [] };
    return room;
}


function joinRoom(room, client) {
    if (!rooms.hasOwnProperty(room)) {
        return client.json({ success: false, message: 'Room not found.' });
    }

    const token = eventsource.subscribe(client);
    rooms[room].participants.push({ token });

    eventsource.message(token, { event: 'joinedroom', data: token });
}


exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
