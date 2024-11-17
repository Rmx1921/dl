import { openDB } from 'idb';

const DB_NAME = 'lotteryDB';
const STORE_NAME = 'ticketsData';

async function initializeDB() {
    const db = await openDB(DB_NAME, 2, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME, { keyPath: 'unique' });
        },
    });
    return db;
}

async function saveTicketsToDB(tickets) {
    const db = await initializeDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const ticket of tickets) {
        const existingTicket = await store.get(ticket.id);
        if (!existingTicket) {
            store.add(ticket);
        }
    }
    await tx.done;
}


async function getAllTicketsFromDB(frontendDate) {
    const db = await initializeDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const allTickets = await store.getAll();
    const targetDate = new Date(frontendDate);
    const filteredTickets = allTickets.filter(ticket => {
        const drawDate = new Date(ticket.drawDate);
        return drawDate.toDateString() === targetDate.toDateString();
    });

    return filteredTickets;
}

async function getAllTickets() {
    const db = await initializeDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const allTickets = await store.getAll();
    return allTickets;
}

async function updateTicketInDB(ticket) {
    const db = await initializeDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put(ticket);

    await tx.done;
}

async function deleteTicketFromDB(ticketId) {
    const db = await initializeDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.delete(ticketId);

    await tx.done;
}

async function restoreTickets(tickets) {
    const db  = await initializeDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    let ticketCount = 0;

    for (const ticket of tickets) {
        const ticketWithUnique = {
            ...ticket,
            date: new Date(ticket.date),
            drawDate: new Date(ticket.drawDate),
            unique: `${ticket.serialNumber}-${ticket.serial}-${ticket.number}`
        };

        console.log('Restoring ticket:', ticketWithUnique);
        store.put(ticketWithUnique);
        ticketCount++;
    }

    console.log('Total tickets processed:', ticketCount);

    await tx.done;
    return { message: 'Tickets restored successfully.' };
}

async function updateSelectedTicketsStatus(selectedTickets) {
    const db = await initializeDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const ticket of selectedTickets) {
        const existingTicket = await store.get(ticket.unique);
        if (existingTicket) {
            existingTicket.state = false;
            store.put(existingTicket);
        }
    }

    await tx.done;
    return { message: 'Selected tickets status updated successfully.' };
}


export { initializeDB, saveTicketsToDB, getAllTicketsFromDB, updateTicketInDB, deleteTicketFromDB, getAllTickets, restoreTickets, updateSelectedTicketsStatus };