import { Server } from "socket.io";

let id = 1;

export const createSocket = (httpServer) => {
    const io = new Server(httpServer, {
        // ניתן להוסיף הגדרות נוספות על השרת
        // cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // כשלקוח מתחבר לשרת
    // socket - נתוני הלקוח שהתחבר כרגע
    io.on('connection', (socket) => {
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
    });
};