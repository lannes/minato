const numberToByteArray = (number) => {
    let bytes = [];

    do {
        bytes.push(number & 0xFF);
        number >>= 8;
    } while (number > 0);

    return bytes;
};

const byteArrayToNumber = (bytes) => {
    let number = 0;

    for (let i = bytes.length - 1; i >= 0; i--) {
        number <<= 8;
        number |= bytes[i];
    }

    return number;
};
