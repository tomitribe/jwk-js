export declare const webCrypto: boolean | Crypto;
export declare const webCryptoSubtle: boolean | SubtleCrypto;
export declare class RSA {
    static ASN1fromPEM(body: ArrayBuffer | Uint8Array): any;
    static JWKfromASN1(asn1: any, type?: string, extra?: any): any;
    static JWKfromRSA(secret: string, type?: "public" | "private", extra?: any): Promise<any>;
    static createSigner(name: string): any;
    static sign(bits: number): (thing: string, privateKey: string) => Promise<string>;
    static createVerifier(name: string): any;
    static verify(bits: number): (thing: string, signature: string, publicKey: string) => Promise<boolean>;
}
