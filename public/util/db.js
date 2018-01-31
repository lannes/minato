const idb = this.indexedDB || this.mozIndexedDB || this.webkitIndexedDB || this.msIndexedDB;

const idbTransaction = this.IDBTransaction || this.webkitIDBTransaction || this.msIDBTransaction;
const idbKeyRange = this.IDBKeyRange || this.webkitIDBKeyRange || this.msIDBKeyRange;

if (idbTransaction) {
    idbTransaction.READ_WRITE = this.IDBTransaction.READ_WRITE || 'readwrite';
    idbTransaction.READ_ONLY = this.IDBTransaction.READ_ONLY || 'readonly';
}

var db = null;

class Database {
    static open(dbName, dbVersion, callback) {
        return new Promise((resolve, reject) => {
            let request = idb.open(dbName, dbVersion);

            request.onupgradeneeded = (event) => {
                console.log('upgradeneeded');
                db = event.target.result;

                //if (db.objectStoreNames.contains("todo")) {
                //    db.deleteObjectStore("todo");
                //}
                callback();
            };

            request.onsuccess = (event) => {
                console.log('success');
                db = event.target.result;
                resolve();
            };

            request.onerror = (event) => {
                console.log('open: ' + event.target.errorCode);
                reject(event.target.errorCode);
            };

            request.onblocked = () => {
                console.log('open.blocked');
            };
        });
    }

    static close() {
        db.close();
    }

    static exists(storeName) {
        return db.objectStoreNames.contains(storeName);
    }

    static createStore(storeName, key) {
        if (key)
            return db.createObjectStore(storeName, { keyPath: key });

        return db.createObjectStore(storeName, {
            keyPath: 'id',
            autoIncrement: true
        });
    }

    static getObjectStore(storeName, mode) {
        let transaction = db.transaction(storeName, mode);
        if (transaction) {
            transaction.oncomplete = () => {
            }

            transaction.onabort = () => {
                console.log('transaction aborted.');
                db.close();
            }

            transaction.ontimeout = () => {
                console.log('transaction timeout.');
                db.close();
            }

            return transaction.objectStore(storeName);
        }
    }

    static get(storeName, keyValue) {
        return new Promise((resolve, reject) => {
            let objectStore = Database.getObjectStore(storeName, idbTransaction.READ_ONLY);
            let request = objectStore.get(keyValue);

            request.onsuccess = (event) => {
                let matching = event.target.result;
                resolve(matching);
            };

            request.onerror = (event) => {
                console.log('open: ' + event.target.errorCode);
                reject(event.target.errorCode);
            };
        });
    }

    static getAll(storeName) {
        return new Promise((resolve, reject) => {
            let objectStore = Database.getObjectStore(storeName, idbTransaction.READ_ONLY);

            let result = [];
            let request = objectStore.openCursor();
            request.onsuccess = (event) => {
                let cursor = event.target.result;

                if (cursor) {
                    result.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(result);
                }
            };
        });
    }

    static add(storeName, obj) {
        return new Promise((resolve, reject) => {
            let objectStore = Database.getObjectStore(storeName, idbTransaction.READ_WRITE);
            let request = objectStore.put(obj);

            request.onsuccess = (event) => {
                resolve();
            };

            request.onerror = (event) => {
                reject();
            };
        });
    }

    static addList(storeName, objs) {
        let objectStore = Database.getObjectStore(storeName, idbTransaction.READ_WRITE);

        for (let i in objs) {
            objectStore.put(objs[i]);
        }
    }

    static remove(storeName, index) {
        let objectStore = Database.getObjectStore(storeName, idbTransaction.READ_WRITE);
        let request = objectStore.delete(index);

        request.onsuccess = (event) => {
        };
    }

    static delete(databaseName) {
        return new Promise((resolve, reject) => {
            let request = idb.deleteDatabase(databaseName);
            request.onsuccess = () => {
                console.log('Deleted database successfully');
                resolve();
            };

            request.onerror = () => {
                console.log('Couldn\'t delete database');
                reject();
            };

            request.onblocked = () => {
                console.log('Couldn\'t delete database due to the operation being blocked');
                reject();
            };
        });
    }
}

