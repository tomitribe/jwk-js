export declare const ECCurves: {
    name: string;
    curve: string;
    coordinateLength: number;
}[];
export declare class EC {
    static ASN1fromPEM(body: ArrayBuffer | Uint8Array): any;
    static JWKfromASN1(asn1: any, type?: string, extra?: any): any;
    static JWKfromEC(secret: string, type?: "public" | "private", extra?: any): Promise<any>;
}
