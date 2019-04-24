export declare const webCrypto: boolean | Crypto;
export declare const webCryptoSubtle: boolean | SubtleCrypto;
export declare class HMAC {
    static createSigner(name: string, secret: string): Promise<any>;
    static sign(bits: number): (thing: string, secret: string) => Promise<string>;
    static verify(bits: number): (thing: string, signature: string, secret: string) => Promise<boolean>;
}
