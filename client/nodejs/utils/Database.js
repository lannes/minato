let db = null;

class KDatabase {
    static open(dbName) {
        return new Promise((resolve) => {
            //db = levelup(leveldown(dbName), { valueEncoding: 'json' }, (err, database) => {
            db = levelup(leveldown(dbName), (err, database) => {
                if (err) {
                    console.log(`open error: ${err}`);
                    resolve(null);
                    return;
                }

                resolve(database);
            });
        });
    }

    static close() {
        db.close();
    }

    static get(storeName, keyValue) {
        return new Promise((resolve) => {
            db.get(`${storeName}~${keyValue}~`, (err, value) => {
                if (err) {
                    console.log(`db get error: ${err}`);
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
            db.createReadStream({ start: storeName + '~', end: storeName + '~~' })
                .on('data', (data) => {
                    array.push(data.value);
                })
                .on('error', (err) => {
                    console.log(`getAll(${storeName}: ${err}`);
                })
                .on('end', () => {
                    resolve(array);
                });
        });
    }

    static add(storeName, obj, keyValue = '') {
        return new Promise((resolve) => {
            db.put(storeName + '~' + keyValue + '~', obj, (err) => {
                if (err) {
                    console.log(`add(${storeName}: ${err}`);
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