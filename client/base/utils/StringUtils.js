class StringUtils {
    static isMultibyte(str) {
        return /[\uD800-\uDFFF]/.test(str);
    }

    static isHex(str) {
        return /[0-9A-Fa-f]*/.test(str);
    }

    static isHexBytes(str, length) {
        if (!StringUtils.isHex(str))
            return false;
        if (str.length % 2 !== 0)
            return false;
        if (typeof length === 'number' && str.length / 2 !== length)
            return false;

        return true;
    }
}