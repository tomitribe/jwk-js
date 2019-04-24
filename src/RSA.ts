import crypto from "crypto";
export const webCrypto = typeof window === "object" && (window.crypto || window['msCrypto']);
export const webCryptoSubtle = webCrypto && (webCrypto.subtle || webCrypto['webkitSubtle'] || webCrypto['Subtle']);

import { ASN1 } from "./asn1";
import { PEM } from "./PEM";
import { AB2s, b2bu, bu2b, bu2s, ILLEGAL_ARGUMENT, s2AB, s2b, s2bu, tryPromise } from "./util";

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

    static createSigner(name: string): any {
        if (webCryptoSubtle) {
            return {
                update: function (thing: string): any {
                    return {
                        sign: async function (secret: string, encoding: string): Promise<any> {
                            return RSA.JWKfromRSA(secret, 'private', {
                                key_ops: ['sign'],
                                alg: name.replace('SHA-', 'RS')
                            }).then(async keyData => {
                                return webCryptoSubtle.importKey(
                                    'jwk',
                                    keyData,
                                    { name: 'RSASSA-PKCS1-v1_5', hash: { name: name } },
                                    true,
                                    ['sign']
                                ).then(async key => {
                                    return webCryptoSubtle.sign(
                                        { name: 'RSASSA-PKCS1-v1_5', hash: { name: name } },
                                        key,
                                        s2AB(thing)
                                    ).then(AB2s).then(s2b)
                                })
                            });
                        }
                    }
                }
            }
        } else {
            if (crypto && crypto.createSign) {
                return crypto.createSign(name.replace('SHA-', 'RSA-SHA'))
            } else {
                throw new Error(ILLEGAL_ARGUMENT);
            }
        }
    }

    static sign(bits: number) {
        return async function sign(thing: string, privateKey: string): Promise<string> {
            return tryPromise(() => {
                return RSA.createSigner('SHA-' + bits)
                    .then(res => res
                        .update(thing)
                        .sign(privateKey, 'base64')
                        .then(b2bu)
                    );
            });
        }
    }

    static createVerifier(name: string): any {
        if (webCryptoSubtle) {
            return {
                update: function (thing: string): any {
                    return {
                        verify: async function (secret: string, signature: string, encoding: string): Promise<boolean> {
                            return RSA.JWKfromRSA(secret, 'public', {
                                key_ops: ['verify'],
                                alg: name.replace('SHA-', 'RS')
                            }).then(async ({ kty, n, e }) => {
                                return webCryptoSubtle.importKey(
                                    'jwk',
                                    { kty, n, e },
                                    { name: 'RSASSA-PKCS1-v1_5', hash: { name: name } },
                                    false,
                                    ['verify']
                                ).then(key => {
                                    return webCryptoSubtle.verify(
                                        'RSASSA-PKCS1-v1_5',
                                        key,
                                        s2AB(bu2s(signature)),
                                        s2AB(thing)
                                    )
                                })
                            });
                        }
                    }
                }
            }
        } else {
            if (crypto && crypto.createVerify) {
                return crypto.createVerify(name.replace('SHA-', 'RSA-SHA'))
            } else {
                throw new Error(ILLEGAL_ARGUMENT);
            }
        }
    }

    static verify(bits: number) {
        return async function verify(thing: string, signature: string, publicKey: string): Promise<boolean> {
            try {
                return await RSA.createVerifier('SHA-' + bits)
                    .then(res => res
                        .update(thing)
                        .verify(publicKey, bu2b(signature), 'base64')
                    );
            } catch (e) {
                return Promise.reject(new Error(e.message));
            }
        }
    }
}

