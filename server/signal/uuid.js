const crypto = require('crypto');
class UUID {
}
UUID.pool = 31 * 128;
UUID.r = crypto.randomBytes(UUID.pool);
UUID.j = 0;
UUID.str = '10000000-1000-4000-8000-100000000000';
UUID.len = UUID.str.length;
UUID.strs = [
    0, 0, 0, 0, 0, 0, 0, 0, '-',
    0, 0, 0, 0, '-',
    0, 0, 0, 0, '-',
    0, 0, 0, 0, '-',
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];
UUID.v4 = () => {
    let ch;
    let chi;
    for (chi = 0; chi < UUID.len; chi++) {
        ch = UUID.str[chi];
        if ('-' === ch || '4' === ch) {
            UUID.strs[chi] = ch;
            continue;
        }
        UUID.j++;
        if (UUID.j >= UUID.r.length) {
            UUID.r = crypto.randomBytes(UUID.pool);
            UUID.j = 0;
        }
        if ('8' === ch) {
            UUID.strs[chi] = (8 + UUID.r[UUID.j] % 4).toString(16);
            continue;
        }
        UUID.strs[chi] = (UUID.r[UUID.j] % 16).toString(16);
    }
    return UUID.strs.join('');
};

module.exports = UUID;