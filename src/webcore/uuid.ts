import * as crypto from 'crypto';

export class UUID {
    private static pool = 31 * 128; // 36 chars minus 4 dashes and 1 four
    private static r = crypto.randomBytes(UUID.pool);
    private static j = 0;
    private static str = '10000000-1000-4000-8000-100000000000';
    private static len = UUID.str.length; // 36
    private static strs = [
        0, 0, 0, 0, 0, 0, 0, 0, '-',
        0, 0, 0, 0, '-',
        0, 0, 0, 0, '-',
        0, 0, 0, 0, '-',
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    public static v4 = (): string => {
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
    }
}
