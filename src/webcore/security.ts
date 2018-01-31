import * as crypto from 'crypto';

export class Security {
    private static readonly algorithm = 'aes-256-ctr';
    private static readonly password = 'e89106e2801740389ab242e191496c2a';

    public static encrypt = (text): string => {
        let cipher = crypto.createCipher(Security.algorithm, Security.password);
        let crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');

        return crypted;
    }

    public static decrypt = (text): string => {
        let decipher = crypto.createDecipher(Security.algorithm, Security.password);
        let dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');

        return dec;
    }
}