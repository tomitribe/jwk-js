import { ASN1 } from "./asn1";
import { PEM } from "./PEM";
import { AB2s, ILLEGAL_ARGUMENT, s2bu, tryPromise } from "./util";

export class RSA {
    static ASN1fromPEM(body: ArrayBuffer | Uint8Array): any {
        if (!body) throw new Error(ILLEGAL_ARGUMENT);

        if (body instanceof ArrayBuffer) body = new Uint8Array(body);
        let asn1 = ASN1.decode(body), res = {};

        if (asn1.sub.length === 3) {
            asn1 = asn1.sub[2].sub[0];
        }
        if (asn1.sub.length === 9) {
            // Parse the private key.
            res['modulus'] = asn1.sub[1].getAB(); // ArrayBuffer
            res['publicExponent'] = parseInt(asn1.sub[2].getHex(), 16); // int
            res['privateExponent'] = asn1.sub[3].getAB(); // ArrayBuffer
            res['prime1'] = asn1.sub[4].getAB(); // ArrayBuffer
            res['prime2'] = asn1.sub[5].getAB(); // ArrayBuffer
            res['exponent1'] = asn1.sub[6].getAB(); // ArrayBuffer
            res['exponent2'] = asn1.sub[7].getAB(); // ArrayBuffer
            res['coefficient'] = asn1.sub[8].getAB(); // ArrayBuffer
        } else if (asn1.sub.length === 2) {
            // Parse the public key.
            asn1 = asn1.sub[1].sub[0];

            res['modulus'] = asn1.sub[0].getAB(); // ArrayBuffer
            res['publicExponent'] = parseInt(asn1.sub[1].getHex(), 16); // int
        }

        res['bits'] = (res['modulus'].length - 1) * 8 + Math.ceil(
            Math.log(res['modulus'][0] + 1) / Math.log(2)
        );

        if (!res['bits']) {
            throw new Error(ILLEGAL_ARGUMENT);
        }

        return res;
    }

    static JWKfromASN1(asn1: any, type?: string, extra?: any): any {
        const pemTypes = ['public', 'private'];
        if (!asn1) throw new Error(ILLEGAL_ARGUMENT);

        type = ((typeof type === 'string') && type.toLowerCase())
            || pemTypes[!!asn1.privateExponent ? 1 : 0];

        if (type === 'private' && !asn1.privateExponent) {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        let v = asn1.publicExponent;
        const expSize = Math.ceil(Math.log(v) / Math.log(256));
        const exp = new Uint8Array(expSize).map(function (el) {
            el = v % 256;
            v = Math.floor(v / 256);
            return el
        }).reverse();

        let jwk = Object.assign({ kty: 'RSA' }, extra, {
            n: s2bu(AB2s(asn1.modulus)),
            e: s2bu(AB2s(exp)),
        });

        if (type === 'private') {
            Object.assign(jwk, {
                d: s2bu(AB2s(asn1.privateExponent)),
                p: s2bu(AB2s(asn1.prime1)),
                q: s2bu(AB2s(asn1.prime2)),
                dp: s2bu(AB2s(asn1.exponent1)),
                dq: s2bu(AB2s(asn1.exponent2)),
                qi: s2bu(AB2s(asn1.coefficient))
            });
        }
        return jwk;
    }

    static JWKfromRSA(secret: string, type?: "public" | "private", extra?): Promise<any> {
        return tryPromise(() => {
            const pem: PEM = new PEM(secret);
            return RSA.JWKfromASN1(RSA.ASN1fromPEM(pem.body), type, extra)
        })
    }
}

