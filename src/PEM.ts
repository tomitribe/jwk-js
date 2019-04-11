import { b2s, bu2b, ILLEGAL_ARGUMENT, s2AB } from "./util";

export class PEM {
    body: ArrayBuffer | Uint8Array;
    type: 'private' | 'public';

    constructor(secret: string) {
        if (typeof secret !== 'string') {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        this.type = 'public';

        const ignore = (line: string): boolean => {
            if (ignoreLinesPriv.some(ign => line.toUpperCase().indexOf(ign) > -1)) {
                this.type = 'private';
                return false;
            }
            return !ignoreLinesPub.some(ign => line.toUpperCase().indexOf(ign) > -1);
        };

        const lines = secret.split('\n'),
            ignoreLinesPriv = [
                '-BEGIN PRIVATE KEY-',
                '-END PRIVATE KEY-',
                '-BEGIN EC PRIVATE KEY-',
                '-END EC PRIVATE KEY-',
                '-BEGIN RSA PRIVATE KEY-',
                '-END RSA PRIVATE KEY-'],
            ignoreLinesPub = [
                '-BEGIN RSA PUBLIC KEY-',
                '-BEGIN EC PUBLIC KEY-',
                '-BEGIN PUBLIC KEY-',
                '-END PUBLIC KEY-',
                '-END EC PUBLIC KEY-',
                '-END RSA PUBLIC KEY-'
            ], body = lines.map(line => line.trim()).filter(line =>
            line.length && ignore(line)).join('');
        if (body.length) {
            this.body = s2AB(b2s(bu2b(body)));
            return this;
        } else {
            throw new Error(ILLEGAL_ARGUMENT);
        }
    }
}


