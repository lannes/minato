const formatNumber = (n) => {
    let result = n.toFixed(0).replace(/./g, (c, i, a) => {
        return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
    });

    return result;
};

const formatHashRate = (n) => {
    if (isNaN(n))
        return '0 ';

    if (n < 1e3)
        return n + ' ';

    if (n < 1e6)
        return (n / 1e3).toFixed(2) + ' k';

    if (n < 1e9)
        return (n / 1e6).toFixed(2) + ' m';

    return (n / 1e9).toFixed(2) + ' g';
}