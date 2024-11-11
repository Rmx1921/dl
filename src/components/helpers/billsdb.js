import { openDB } from 'idb';

const USER_DB_NAME = 'billsData';
const USER_STORE_NAME = 'bills';
const CHUNK_SIZE = 100;


async function initializeUserDB() {
    const db = await openDB(USER_DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(USER_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        },
    });
    return db;
}

async function getBills(limit = 50, offset = 0) {
    const db = await initializeUserDB();

    const countTx = db.transaction(USER_STORE_NAME, 'readonly');
    const countStore = countTx.objectStore(USER_STORE_NAME);
    const totalCount = await countStore.count();

    const dataTx = db.transaction(USER_STORE_NAME, 'readonly');
    const dataStore = dataTx.objectStore(USER_STORE_NAME);

    const bills = [];
    let cursor = await dataStore.openCursor(null, 'prev');
    let skipped = 0;

    while (cursor && skipped < offset) {
        cursor = await cursor.continue();
        skipped++;
    }

    while (cursor && bills.length < limit) {
        bills.push(cursor.value);
        cursor = await cursor.continue();
    }

    return {
        data: bills,
        total: totalCount
    };
}

async function getAllBillData() {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readonly');
    const store = tx.objectStore(USER_STORE_NAME);

    const bills = [];
    let cursor = await store.openCursor();

    while (cursor) {
        bills.push(cursor.value);
        cursor = await cursor.continue();
    }

    return bills;
}


async function saveBills(newBillData) {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(USER_STORE_NAME);

    store.put(newBillData);
    await tx.done;
}

async function editBills(billData) {
    // const lastBill = await getLastBills();
    // const newBillNumber = lastBill ? lastBill.billNumber + 1 : 1;

    const newBillData = {
        date: billData.date || new Date(),
        name: billData.name || 'Unknown',
        billno: newBillNumber,
        details: billData.details,
        total: billData.total || 0,
        pwt: billData.pwt || 0,
    };

    await saveBills(newBillData);

    return newBillNumber;
}

async function findBills(query,field) {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readonly');
    const store = tx.objectStore(USER_STORE_NAME);

    const bills = [];
    let cursor = await store.openCursor();

    if (!['name', 'date','billno'].includes(field)) {
        throw new Error('Invalid field. Search can only be performed on "name" or "date".');
    }

       while (cursor) {
           if (cursor.value[field] === query) {
               bills.push(cursor.value);
           }
           cursor = await cursor.continue();
       }

    return bills;
}

async function importBillData(jsonData) {
    const db = await openDB(USER_DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(USER_STORE_NAME)) {
                db.createObjectStore(USER_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });

    try {
        let processedCount = 0;
        const bills = Array.isArray(jsonData) ? jsonData : JSON.parse(jsonData);
        const totalRecords = bills.length;

        for (let i = 0; i < totalRecords; i += CHUNK_SIZE) {
            const chunk = bills.slice(i, i + CHUNK_SIZE);

            const tx = db.transaction(USER_STORE_NAME, 'readwrite');
            const store = tx.objectStore(USER_STORE_NAME);

            const promises = chunk.map(bill => {
                const billData = { ...bill };
                delete billData.id;
                return store.add(billData);
            });

            await Promise.all(promises);
            await tx.done;

            processedCount += chunk.length;
        }

        return {
            success: true,
            message: `Successfully imported ${processedCount} records`,
            totalProcessed: processedCount
        };

    } catch (error) {
        console.error('Import error:', error);
        throw {
            success: false,
            message: error.message || 'Failed to import bill data',
            error: error
        };
    } finally {
        db.close();
    }
}

export { saveBills, getBills, editBills, findBills, getAllBillData, importBillData };