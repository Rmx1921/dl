import { openDB } from 'idb';

const USER_DB_NAME = 'userDB';
const USER_STORE_NAME = 'users';

async function initializeUserDB() {
    const db = await openDB(USER_DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(USER_STORE_NAME, { keyPath: 'id' });
        },
    });
    return db;
}

async function saveUserToDB(user) {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(USER_STORE_NAME);

    const existingUser = await store.get(user.id);
    if (!existingUser) {
        store.add(user);
    }

    await tx.done;
}

async function getAllUsersFromDB() {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readonly');
    const store = tx.objectStore(USER_STORE_NAME);

    return store.getAll();
}

async function updateUserInDB(user) {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(USER_STORE_NAME);

    store.put(user);

    await tx.done;
}

async function deleteUserFromDB(userId) {
    const db = await initializeUserDB();
    const tx = db.transaction(USER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(USER_STORE_NAME);

    store.delete(userId);

    await tx.done;
}

export { initializeUserDB, saveUserToDB, getAllUsersFromDB, updateUserInDB, deleteUserFromDB };