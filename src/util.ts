export const UNSUPPORTED_ALGORITHM = 'Unsupported algorithm name specified! Supported algorithms: "HS256", "HS384", "HS512", "RS256", "RS384", "RS512" and "none".';
export const ILLEGAL_ARGUMENT = 'Illegal argument specified!';

export function num2hex(memo: string, i: number): string {
    return memo + ('0' + i.toString(16)).slice(-2);
}

// clean leading zeros
export function cleanZeros(b) {
    return b[0] === 0 ? cleanZeros(b.slice(1)) : b;
}

export function hex2AB(hex: string): ArrayBuffer | Uint8Array {
    if (!hex) throw new Error(ILLEGAL_ARGUMENT);
    const match = hex.match(/[0-9A-F]{2}/ig);
    if (!match) throw new Error(ILLEGAL_ARGUMENT);
    return new Uint8Array(match.map(i => parseInt(i, 16)))
}

export function AB2hex(buff: ArrayBuffer | Uint8Array): string {
    if (buff instanceof ArrayBuffer) buff = new Uint8Array(buff);
    return buff.reduce(num2hex, '');
}

/**
 * Try running function and replace it's response as Promise.resolve/reject
 *
 * @param {function} fn - fn to call in for response
 *
 * @returns {Promise<any>} resulting Promise
 */
export function tryPromise(fn) {
    try {
        return Promise.resolve(fn());
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * Converts string to ArrayBuffer
 *
 * @param {string} str - data string to convert
 *
 * @returns {ArrayBuffer | Uint8Array} charCode ArrayBuffer
 */
export function s2AB(str: string): ArrayBuffer | Uint8Array {
    const buff = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) buff[i] = str.charCodeAt(i);
    return buff;
}

/**
 * Converts ArrayBuffer to string
 *
 * @param {ArrayBuffer | Uint8Array} buff - charCode ArrayBuffer to convert
 *
 * @returns {string} data string
 */
export function AB2s(buff: ArrayBuffer | Uint8Array): string {
    if (buff instanceof ArrayBuffer) buff = new Uint8Array(buff);
    return String.fromCharCode.apply(String, buff);
}

/**
 * Converts string to base64 string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} decoded data string
 */
export function b2s(str: string): string {
    try {
        if (typeof window === 'object' && typeof window.atob === 'function') {
            return window.atob(str);
        } else if (typeof Buffer !== 'undefined') {
            return Buffer.from(str, 'base64').toString('binary')
        } else throw new Error(ILLEGAL_ARGUMENT);
    } catch (e) {
        throw new Error(e);
    }
}

/**
 * Converts base64 string to base64url string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64url string
 */
export function b2bu(str: string): string {
    if ((typeof str !== 'string') || (str.length % 4 !== 0)) {
        throw new Error(ILLEGAL_ARGUMENT);
    }

    return str
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 *
 * Converts base64url string to base64 string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64 string
 */
export function bu2b(str: string): string {
    if ((typeof str !== 'string') || (str.length % 4 === 1)) {
        throw new Error(ILLEGAL_ARGUMENT);
    }

    for (; (str.length % 4 !== 0);) {
        str += '=';
    }
    return str
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
}

/**
 * Converts base64url string to string
 *
 * @param {string} str - base64url string to convert
 *
 * @returns {string} decoded data string
 */
export function bu2s(str: string): string {
    return b2s(bu2b(str));
}

/**
 * Converts base64 string to string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64 string
 */
export function s2b(str: string): string {
    try {
        if (typeof window === 'object' && typeof window.atob === 'function') {
            return window.btoa(str);
        } else if (typeof Buffer !== 'undefined') {
            return Buffer.from(str).toString('base64');
        } else throw new Error(ILLEGAL_ARGUMENT);
    } catch (e) {
        throw new Error(e);
    }
}

/**
 * Converts string to base64url string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64url string
 */
export function s2bu(str: string): string {
    return b2bu(s2b(str));
}
