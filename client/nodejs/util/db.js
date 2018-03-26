const levelup = require('levelup');
const leveldown = require('leveldown');

let db = null;

class KDatabase {
    static open(dbName) {
        db = levelup(leveldown(dbName), (err, db) => {
            if (err)
                throw err;
        });
    }

    static close() {
        db.close();
    }

    static get(storeName, keyValue) {
        return new Promise((resolve) => {
            db.get(storeName + '~' + keyValue + '~', (err, value) => {
                if (err) {
                    console.log('db get error: ', err);
                    resolve(null);
                    return;
                }

                resolve(value);
            });
        });
    }

    static getAll(storeName) {
        return new Promise((resolve) => {
            let array = new Array();

            return new Promise((resolve) => {
                db.createReadStream({ start: storeName + '~', end: storeName + '~~' })
                    .on('data', (data) => {
                        array.push(data);
                    })
                    .on('error', (err) => {
                        console.log(`getAll(${storeName}: `, err);
                    })
                    .on('end', () => {
                        resolve(array);
                    });
            });
        });
    }

    static add(storeName, obj) {
        return new Promise((resolve) => {
            db.put(storeName + '~' + keyValue + '~', obj, (err) => {
                if (err) {
                    console.log(`add(${storeName}: `, err);
                    return resolve(false);
                }

                resolve(true);
            });
        });
    }

    static addList(storeName, objs) {

    }

    static remove(storeName, index) {

    }

    static delete(dbName) {
        db.destroy(dbName, (err) => {
            if (err)
                console.log(err);
        });
    }
}

module.exports = KDatabase;