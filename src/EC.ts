import { ASN1 } from "./asn1";
import { PEM } from "./PEM";
import { AB2s, ILLEGAL_ARGUMENT, s2bu, tryPromise } from "./util";

export const ECCurves = [
    {
        name: "p-256",
        curve: "1.2.840.10045.3.1.7",
        coordinateLength: 32
    },
    {
        name: "p-384",
        curve: "1.3.132.0.34",
        coordinateLength: 48
    },
    {
        name: "p-384",
        curve: "1.3.132.0.35",
        coordinateLength: 66
    }
];

export class EC {
    static ASN1fromPEM(body: ArrayBuffer | Uint8Array): any {
        if (!body) throw new Error(ILLEGAL_ARGUMENT);

        if (body instanceof ArrayBuffer) body = new Uint8Array(body);
        let asn1 = ASN1.decode(body);
        const res = {};
        if (asn1.sub.length === 3) {
            res['version'] = asn1.sub[0].content(); // int

            res['keyType'] = asn1.sub[1].sub[0].content(); // string
            res['namedCurve'] = asn1.sub[1].sub[1].content(); // string

            res['versionSub'] = asn1.sub[2].sub[0].sub[0].content(); // int
            res['privateKey'] = asn1.sub[2].sub[0].sub[2].getAB(); // ArrayBuffer

            res['curveTypeSub'] = asn1.sub[2].sub[0].sub[2].sub[0].content(); // string
            res['publicKey'] = asn1.sub[2].sub[0].sub[3].sub[0].getAB(); // ArrayBuffer
        } else if (asn1.sub.length === 2) {
            res['keyType'] = asn1.sub[0].sub[0].content(); // string
            res['namedCurve'] = asn1.sub[0].sub[1].content(); // string
            res['publicKey'] = asn1.sub[1].getAB(); // int
        }
        return asn1;
    }

    static JWKfromASN1(asn1: any, type?: string, extra?: any): any {
        const pemTypes = ['public', 'private'];
        if (!asn1) throw new Error(ILLEGAL_ARGUMENT);

        type = ((typeof type === 'string') && type.toLowerCase())
            || pemTypes[!!asn1.privateKey ? 1 : 0];

        if (type === 'private' && !asn1.privateKey) {
            throw new Error(ILLEGAL_ARGUMENT);
        }

        const crv = ECCurves.find(c => c.curve === asn1.namedCurve);
        if (!crv) {
            throw new Error(ILLEGAL_ARGUMENT);
        }

        let publicKey = asn1.publicKey;

        if (publicKey.readInt8(0) !== 4) {
            throw new Error(ILLEGAL_ARGUMENT);
        };
        let jwk = Object.assign({ kty: 'EC', crv: crv.name }, extra, {
            x: s2bu(AB2s(publicKey.slice(1, crv.coordinateLength))),
            y: s2bu(AB2s(publicKey.slice(crv.coordinateLength + 1, 2*(crv.coordinateLength + 1))))
        });

        if (type === 'private') {
            Object.assign(jwk, {
                d: s2bu(AB2s(asn1.privateKey))
            });
        }
        return jwk;
    }

    static JWKfromEC(secret: string, type?: "public" | "private", extra?): Promise<any> {
        return tryPromise(() => {
            const pem: PEM = new PEM(secret);
            return EC.JWKfromASN1(EC.ASN1fromPEM(pem.body), type, extra)
        })
    }
}

