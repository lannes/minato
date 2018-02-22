const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);

const buf2hex = buf => buf.map(b => ('00' + b.toString(16)).slice(-2)).join('');

const hex2buf = hex => {
    let buf = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
        buf[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    return buf;
};

const hexToBinary = (s) => {
    let ret = '';
    const lookupTable = {
        '0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100',
        '5': '0101', '6': '0110', '7': '0111', '8': '1000', '9': '1001',
        'a': '1010', 'b': '1011', 'c': '1100', 'd': '1101',
        'e': '1110', 'f': '1111'
    };

    for (let i = 0; i < s.length; i++) {
        if (lookupTable[s[i]]) {
            ret += lookupTable[s[i]];
        } else {
            return null;
        }
    }

    return ret;
};

const base64ToHex = (base64) => {
    const data = atob((base64 + '===='.substr(base64.length % 4))
        .replace(/\-/g, '+')
        .replace(/\_/g, '/'));

    let result = '';
    for (let i = 0; i < data.length; i++) {
        let hex = data.charCodeAt(i).toString(16);
        result += (hex.length == 2 ? hex : '0' + hex);
    }

    return result;
};

const hexToBase64 = (hex) => {
    let raw = '';
    for (let i = 0; i < hex.length; i += 2) {
        raw += String.fromCharCode(parseInt(hex[i] + hex[i + 1], 16));
    }

    return btoa(raw).replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const cloneDeep = (item) => {
    if (!item) { return item; } // null, undefined values check

    var types = [Number, String, Boolean],
        result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach((type) => {
        if (item instanceof type) {
            result = type(item);
        }
    });

    if (typeof result == "undefined") {
        if (Object.prototype.toString.call(item) === "[object Array]") {
            result = [];
            item.forEach((child, index, array) => {
                result[index] = cloneDeep(child);
            });
        } else if (typeof item == "object") {
            // testing that this is DOM
            if (item.nodeType && typeof item.cloneNode == "function") {
                var result = item.cloneNode(true);
            } else if (!item.prototype) { // check that this is a literal
                if (item instanceof Date) {
                    result = new Date(item);
                } else {
                    // it is an object literal
                    result = {};
                    for (var i in item) {
                        result[i] = cloneDeep(item[i]);
                    }
                }
            } else {
                // depending what you would like here,
                // just keep the reference, or create new object
                if (item.constructor) {
                    // would not advice to do that, reason? Read below
                    result = new item.constructor();
                } else {
                    result = item;
                }
            }
        } else {
            result = item;
        }
    }

    return result;
};
