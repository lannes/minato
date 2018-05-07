const formatNumber = (n) => {
    let result = n.toFixed(0).replace(/./g, (c, i, a) => {
        return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
    });

    return result;
};

const formatHashRate = (n) => {
    if (isNaN(n))
        return '0 ';

    if (n < 1000)
        return n + ' ';

    if (n < 1000000)
        return (n / 1024).toFixed(2) + ' k';

    if (n < 1000000000)
        return (n / 1048576).toFixed(2) + ' m';

    return (n / 1073741824).toFixed(2) + ' g';
}