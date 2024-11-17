import { openDB } from 'idb';

const USER_DB_NAME = 'billnoDB';
const USER_STORE_NAME = 'billno';

async function initializeUserDB() {
    const db = await openDB(USER_DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(USER_STORE_NAME, { keyPath: 'id' });
        },
    });
    return db;
}

async function getLastBillNumber() {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readonly');
    const store = tx.objectStore(USER_STORE_NAME);

    const lastBillEntry = await store.get(1);
    return lastBillEntry ? lastBillEntry.billNumber : null;
}

async function saveBillNumber(newBillNumber) {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(USER_STORE_NAME);

    store.put({ id: 1, billNumber: newBillNumber });
    await tx.done;
}

async function generateNewBillNumber() {
    const lastBillNumber = await getLastBillNumber();
    const newBillNumber = lastBillNumber ? lastBillNumber + 1 : 1;

    await saveBillNumber(newBillNumber);
    return newBillNumber;
}

export { generateNewBillNumber, getLastBillNumber, saveBillNumber };