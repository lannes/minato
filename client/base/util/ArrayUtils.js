if (typeof require !== 'undefined') {
    global.StringUtils = require('./StringUtils');
}

class ArrayUtils {
    static equals(array1, array2) {
        if (array1 === null && array2 === null)
            return true;

        if (array1 === null || array2 === null)
            return false;

        return array1.length === array2.length
            && array1.every((value, i) => value === array2[i]);
    }

    static toAscii(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    static fromAscii(string) {
        const buf = new Uint8Array(string.length);
        for (let i = 0; i < string.length; ++i) {
            buf[i] = string.charCodeAt(i);
        }
        return buf;
    }
    
    static toHex(array) {
        if (!array)
            return '';
        return Array.prototype.map.call(array, x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    static fromHex(hex) {
        hex = hex.trim();
        if (!StringUtils.isHexBytes(hex))
            return null;
        return Uint8Array.from(hex.match(/.{2}/g) || [], byte => parseInt(byte, 16));
    }

    static toBase64(array) {
        if (!array)
            return '';
        return btoa(String.fromCharCode(...array));
    }

    static fromBase64(base64) {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }

    static fromBase64Url(base64) {
        return Uint8Array.from(atob(
            base64.replace(/_/g, '/').replace(/-/g, '+').replace(/\./g, '=')),
            c => c.charCodeAt(0)
        );
    }
    
    static randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static subarray(uintarr, begin, end) {
        function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

        if (begin === undefined) { begin = 0; }
        if (end === undefined) { end = uintarr.byteLength; }

        begin = clamp(begin, 0, uintarr.byteLength);
        end = clamp(end, 0, uintarr.byteLength);

        let len = end - begin;
        if (len < 0) {
            len = 0;
        }

        return new Uint8Array(uintarr.buffer, uintarr.byteOffset + begin, len);
    }
}

if (typeof module !== 'undefined')
    module.exports = ArrayUtils;


