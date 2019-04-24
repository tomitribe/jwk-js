import crypto from "crypto";
import { AB2s, b2bu, s2AB, s2bu } from "./util";
export const webCrypto = typeof window === "object" && (window.crypto || window['msCrypto']);
export const webCryptoSubtle = webCrypto && (webCrypto.subtle || webCrypto['webkitSubtle'] || webCrypto['Subtle']);

export class HMAC {
    static async createSigner(name: string, secret: string): Promise<any> {
        if (webCryptoSubtle) {
            const keyData = s2AB(secret);
            return webCryptoSubtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: { name: name } },
                true,
                ['sign']
            ).then(key => {
                return {
                    update: async function (thing): Promise<ArrayBuffer> {
                        return webCryptoSubtle.sign(
                            'HMAC',
                            key,
                            s2AB(thing)
                        )
                    }
                }
            })
        } else {
            return !!crypto && crypto.createHmac ? Promise.resolve(crypto.createHmac(name.replace('SHA-', 'sha'), secret)) : Promise.reject(webCrypto);
        }
    }

    static sign(bits: number) {
        return async function sign(thing: string, secret: string): Promise<string> {
            const hmac = await HMAC.createSigner('SHA-' + bits, secret);
            return Promise.resolve(webCryptoSubtle ? s2bu(AB2s(hmac && await hmac.update(thing))) : b2bu(hmac && hmac.update(thing).digest('base64')));
        }
    }

    static verify(bits: number) {
        return async function verify(thing: string, signature: string, secret: string): Promise<boolean> {
            return await HMAC.sign(bits)(thing, secret) === signature;
        }
    }
}
