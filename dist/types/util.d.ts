export declare const UNSUPPORTED_ALGORITHM = "Unsupported algorithm name specified! Supported algorithms: \"HS256\", \"HS384\", \"HS512\", \"RS256\", \"RS384\", \"RS512\" and \"none\".";
export declare const ILLEGAL_ARGUMENT = "Illegal argument specified!";
export declare function num2hex(memo: string, i: number): string;
export declare function cleanZeros(b: any): any;
export declare function hex2AB(hex: string): ArrayBuffer | Uint8Array;
export declare function AB2hex(buff: ArrayBuffer | Uint8Array): string;
/**
 * Try running function and replace it's response as Promise.resolve/reject
 *
 * @param {function} fn - fn to call in for response
 *
 * @returns {Promise<any>} resulting Promise
 */
export declare function tryPromise(fn: any): Promise<any>;
/**
 * Converts string to ArrayBuffer
 *
 * @param {string} str - data string to convert
 *
 * @returns {ArrayBuffer | Uint8Array} charCode ArrayBuffer
 */
export declare function s2AB(str: string): ArrayBuffer | Uint8Array;
/**
 * Converts ArrayBuffer to string
 *
 * @param {ArrayBuffer | Uint8Array} buff - charCode ArrayBuffer to convert
 *
 * @returns {string} data string
 */
export declare function AB2s(buff: ArrayBuffer | Uint8Array): string;
/**
 * Converts string to base64 string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} decoded data string
 */
export declare function b2s(str: string): string;
/**
 * Converts base64 string to base64url string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64url string
 */
export declare function b2bu(str: string): string;
/**
 *
 * Converts base64url string to base64 string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64 string
 */
export declare function bu2b(str: string): string;
/**
 * Converts base64url string to string
 *
 * @param {string} str - base64url string to convert
 *
 * @returns {string} decoded data string
 */
export declare function bu2s(str: string): string;
/**
 * Converts base64 string to string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64 string
 */
export declare function s2b(str: string): string;
/**
 * Converts string to base64url string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64url string
 */
export declare function s2bu(str: string): string;
