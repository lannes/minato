class KBuffer {
    static array2buffer(array) {
        var buffer = new ArrayBuffer(array.length);
        var backingArray = new Uint8Array(buffer);

        for (var i = 0; i < array.length; i++) {
            backingArray[i] = array[i];
        }

        return buffer;
    }

    static buffer2array(buffer) {
        return new Uint8Array(buffer);
    } 

    static buffer2hex(buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    static hex2buffer(hex) {
        var buffer = new ArrayBuffer(hex.length / 2);
        var array = new Uint8Array(buffer);
        var k = 0;
        for (var i = 0; i < hex.length; i += 2) {
            array[k] = parseInt(hex[i] + hex[i + 1], 16);
            k++;
        }

        return buffer;
    }

    static str2buffer(stringToEncode, insertBOM) {
        stringToEncode = stringToEncode.replace(/\r\n/g, '\n');

        var utftext = [];
        if (insertBOM === true) {
            utftext[0] = 0xef;
            utftext[1] = 0xbb;
            utftext[2] = 0xbf;
        }

        for (var n = 0; n < stringToEncode.length; n++) {
            var c = stringToEncode.charCodeAt(n);

            if (c < 128) {
                utftext[utftext.length] = c;
            } else if ((c > 127) && (c < 2048)) {
                utftext[utftext.length] = (c >> 6) | 192;
                utftext[utftext.length] = (c & 63) | 128;
            } else {
                utftext[utftext.length] = (c >> 12) | 224;
                utftext[utftext.length] = ((c >> 6) & 63) | 128;
                utftext[utftext.length] = (c & 63) | 128;
            }
        }

        return new Uint8Array(utftext).buffer;
    }
}

if (typeof module !== 'undefined')
    module.exports = KBuffer;