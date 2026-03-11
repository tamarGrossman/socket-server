import { Server } from "socket.io";

let id = 1;
let activeClients = 0;

export const createSocket = (httpServer) => {
    const io = new Server(httpServer, {
        // ניתן להוסיף הגדרות נוספות על השרת
        // cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // כשלקוח מתחבר לשרת
    // socket - נתוני הלקוח שהתחבר כרגע
    io.on('connection', (socket) => {
        // עדכון מונה לקוחות מחוברים
        activeClients += 1;
        io.emit('active clients updated', activeClients);
        console.log(`active clients updated: ${activeClients}`);

        // ניתן להוסיף נתונים על היוזר הנוכחי בצורה כזו לסוקט
        socket.userId = id++;
        socket.userDetails = {
            id: socket.userId,
            name: null,
            color: null
        };

        console.log(`user ${socket.userId} connected successfully`);

        // שליחת אירוע לקליינט הנוכחי שהתחבר
        // בשם שאנחנו בחרנו
        // הקליינט יקבל את המידע רק אם הוא רשום לאירוע
        socket.emit('user connected', { userId: socket.userId });

        socket.on('update client details', ({ name, color }) => {
            socket.userDetails.name = name;
            socket.userDetails.color = color;

            io.to(socket.id).emit('client details updated', {
                userId: socket.userId,
                name,
                color
            });

            console.log(`user ${socket.userId} set profile: ${name}, ${color}`);
        });


        socket.on('new message', (newMessage) => {
            // שיגור אירוע לכל הלקוחות שמחוברים כרגע
            const messageName = socket.userDetails.name || 'unknown';
            const messageColor = socket.userDetails.color || '#000000';

            io.emit('send message', {
                msg: newMessage,
                name: messageName,
                color: messageColor
            });
        });

        socket.on('client disconnecting', ({ name, color }) => {
            const messageName = name || socket.userDetails.name || 'unknown';
            const messageColor = color || socket.userDetails.color || '#000000';

            socket.broadcast.emit('user left', {
                name: messageName,
                color: messageColor,
                text: `לקוח ${messageName} התנתק מהמערכת`
            });

            socket._announcedDisconnect = true;
            console.log(`user ${socket.userId} disconnecting (manual) name=${messageName}`);
        });

        socket.on('disconnect', (reason) => {
            if (socket._announcedDisconnect) {
                console.log(`user ${socket.userId} disconnected after manual event (${reason})`);
            } else {
                const messageName = socket.userDetails.name || 'unknown';
                const messageColor = socket.userDetails.color || '#000000';

                socket.broadcast.emit('user left', {
                    name: messageName,
                    color: messageColor,
                    text: `לקוח ${messageName} התנתק מהמערכת`
                });

                console.log(`user ${socket.userId} disconnected (${reason})`);
            }

            // עדכון מונה לקוחות לאחר ניתוק (גם במקרה שהתנתק ידנית)
            activeClients = Math.max(0, activeClients - 1);
            io.emit('active clients updated', activeClients);
            console.log(`active clients updated: ${activeClients}`);
        });
    });
};