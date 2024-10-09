import { openDB } from 'idb';

const USER_DB_NAME = 'billsData';
const USER_STORE_NAME = 'bills';

async function initializeUserDB() {
    const db = await openDB(USER_DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(USER_STORE_NAME, { keyPath: 'id' });
        },
    });
    return db;
}

async function getLastBills() {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readonly');
    const store = tx.objectStore(USER_STORE_NAME);

    const lastBillEntry = await store.get(1);
    return lastBillEntry ? lastBillEntry.billNumber : null;
}

async function saveBills(newBill) {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(USER_STORE_NAME);

    store.put({ id: 1, billNumber: newBillNumber });
    await tx.done;
}

async function editBills() {
    const lastBillNumber = await getLastBills();
    const newBillNumber = lastBillNumber ? lastBillNumber + 1 : 1;

    await saveBills(newBill);
    return newBillNumber;
}

export {saveBills,getLastBills,editBills}