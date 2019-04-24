export declare class PEM {
    body: ArrayBuffer | Uint8Array;
    type: 'private' | 'public';
    constructor(secret: string);
}
