import crypto from 'crypto';

var max = 10000000000000; // biggest 10^n integer that can still fit 2^53 when multiplied by 256
var Int10 = /** @class */ (function () {
    function Int10(value) {
        this.buf = [+value || 0];
    }
    Int10.prototype.mulAdd = function (m, c) {
        // assert(m <= 256)
        var b = this.buf, l = b.length, i, t;
        for (i = 0; i < l; ++i) {
            t = b[i] * m + c;
            if (t < max)
                c = 0;
            else {
                c = 0 | (t / max);
                t -= c * max;
            }
            b[i] = t;
        }
        if (c > 0)
            b[i] = c;
    };
    Int10.prototype.sub = function (c) {
        // assert(m <= 256)
        var b = this.buf, l = b.length, i, t;
        for (i = 0; i < l; ++i) {
            t = b[i] - c;
            if (t < 0) {
                t += max;
                c = 1;
            }
            else
                c = 0;
            b[i] = t;
        }
        while (b[b.length - 1] === 0)
            b.pop();
    };
    Int10.prototype.toString = function (base) {
        if ((base || 10) != 10)
            throw 'only base 10 is supported';
        var b = this.buf, s = b[b.length - 1].toString();
        for (var i = b.length - 2; i >= 0; --i)
            s += (max + b[i]).toString().substring(1);
        return s;
    };
    Int10.prototype.valueOf = function () {
        var b = this.buf, v = 0;
        for (var i = b.length - 1; i >= 0; --i)
            v = v * max + b[i];
        return v;
    };
    Int10.prototype.simplify = function () {
        var b = this.buf;
        return (b.length == 1) ? b[0] : this;
    };
    return Int10;
}());

var UNSUPPORTED_ALGORITHM = 'Unsupported algorithm name specified! Supported algorithms: "HS256", "HS384", "HS512", "RS256", "RS384", "RS512" and "none".';
var ILLEGAL_ARGUMENT = 'Illegal argument specified!';
function num2hex(memo, i) {
    return memo + ('0' + i.toString(16)).slice(-2);
}
// clean leading zeros
function cleanZeros(b) {
    return b[0] === 0 ? cleanZeros(b.slice(1)) : b;
}
function hex2AB(hex) {
    if (!hex)
        throw new Error(ILLEGAL_ARGUMENT);
    var match = hex.match(/[0-9A-F]{2}/ig);
    if (!match)
        throw new Error(ILLEGAL_ARGUMENT);
    return new Uint8Array(match.map(function (i) { return parseInt(i, 16); }));
}
function AB2hex(buff) {
    if (buff instanceof ArrayBuffer)
        buff = new Uint8Array(buff);
    return buff.reduce(num2hex, '');
}
/**
 * Try running function and replace it's response as Promise.resolve/reject
 *
 * @param {function} fn - fn to call in for response
 *
 * @returns {Promise<any>} resulting Promise
 */
function tryPromise(fn) {
    try {
        return Promise.resolve(fn());
    }
    catch (e) {
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
function s2AB(str) {
    var buff = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++)
        buff[i] = str.charCodeAt(i);
    return buff;
}
/**
 * Converts ArrayBuffer to string
 *
 * @param {ArrayBuffer | Uint8Array} buff - charCode ArrayBuffer to convert
 *
 * @returns {string} data string
 */
function AB2s(buff) {
    if (buff instanceof ArrayBuffer)
        buff = new Uint8Array(buff);
    return String.fromCharCode.apply(String, buff);
}
/**
 * Converts string to base64 string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} decoded data string
 */
function b2s(str) {
    try {
        if (typeof window === 'object' && typeof window.atob === 'function') {
            return window.atob(str);
        }
        else if (typeof Buffer !== 'undefined') {
            return Buffer.from(str, 'base64').toString('binary');
        }
        else
            throw new Error(ILLEGAL_ARGUMENT);
    }
    catch (e) {
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
function b2bu(str) {
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
function bu2b(str) {
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
function bu2s(str) {
    return b2s(bu2b(str));
}
/**
 * Converts base64 string to string
 *
 * @param {string} str - data string to convert
 *
 * @returns {string} base64 string
 */
function s2b(str) {
    try {
        if (typeof window === 'object' && typeof window.atob === 'function') {
            return window.btoa(str);
        }
        else if (typeof Buffer !== 'undefined') {
            return Buffer.from(str).toString('base64');
        }
        else
            throw new Error(ILLEGAL_ARGUMENT);
    }
    catch (e) {
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
function s2bu(str) {
    return b2bu(s2b(str));
}

var ellipsis = "\u2026", reTimeS = /^(\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/, reTimeL = /^(\d\d\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
function stringCut(str, len) {
    if (str.length > len)
        str = str.substring(0, len) + ellipsis;
    return str;
}
var Stream = /** @class */ (function () {
    function Stream(enc, pos) {
        if (pos === void 0) { pos = 0; }
        this.hexDigits = "0123456789ABCDEF";
        if (enc instanceof Stream) {
            this.enc = enc.enc;
            this.pos = enc.pos;
        }
        else {
            this.enc = enc;
            this.pos = pos;
        }
    }
    Stream.prototype.get = function (pos) {
        if (pos === undefined)
            pos = this.pos++;
        if (pos >= this.enc.length)
            throw 'Requesting byte offset ' + pos + ' on a stream of length ' + this.enc.length;
        return (typeof this.enc == "string") ? this.enc.charCodeAt(pos) : this.enc[pos];
    };
    Stream.prototype.hexByte = function (b) {
        return this.hexDigits.charAt((b >> 4) & 0xF) + this.hexDigits.charAt(b & 0xF);
    };
    Stream.prototype.hexDump = function (start, end, raw) {
        var s = "";
        for (var i = start; i < end; ++i) {
            s += this.hexByte(this.get(i));
            if (raw !== true)
                switch (i & 0xF) {
                    case 0x7:
                        s += "  ";
                        break;
                    case 0xF:
                        s += "\n";
                        break;
                    default:
                        s += " ";
                }
        }
        return s;
    };
    Stream.prototype.isASCII = function (start, end) {
        for (var i = start; i < end; ++i) {
            var c = this.get(i);
            if (c < 32 || c > 176)
                return false;
        }
        return true;
    };
    Stream.prototype.parseStringISO = function (start, end) {
        var s = "";
        for (var i = start; i < end; ++i)
            s += String.fromCharCode(this.get(i));
        return s;
    };
    Stream.prototype.parseStringUTF = function (start, end) {
        var s = "";
        for (var i = start; i < end;) {
            var c = this.get(i++);
            if (c < 128)
                s += String.fromCharCode(c);
            else if ((c > 191) && (c < 224))
                s += String.fromCharCode(((c & 0x1F) << 6) | (this.get(i++) & 0x3F));
            else
                s += String.fromCharCode(((c & 0x0F) << 12) | ((this.get(i++) & 0x3F) << 6) | (this.get(i++) & 0x3F));
        }
        return s;
    };
    Stream.prototype.parseStringBMP = function (start, end) {
        var str = "", hi, lo;
        for (var i = start; i < end;) {
            hi = this.get(i++);
            lo = this.get(i++);
            str += String.fromCharCode((hi << 8) | lo);
        }
        return str;
    };
    Stream.prototype.parseTime = function (start, end, shortYear) {
        var s = this.parseStringISO(start, end), m = (shortYear ? reTimeS : reTimeL).exec(s);
        if (!m)
            return "Unrecognized time: " + s;
        if (shortYear) {
            var t = +m[1], y = (t < 70) ? 2000 : 1900;
            m[1] = y + "";
        }
        s = m[1] + "-" + m[2] + "-" + m[3] + " " + m[4];
        if (m[5]) {
            s += ":" + m[5];
            if (m[6]) {
                s += ":" + m[6];
                if (m[7])
                    s += "." + m[7];
            }
        }
        if (m[8]) {
            s += " UTC";
            if (m[8] != 'Z') {
                s += m[8];
                if (m[9])
                    s += ":" + m[9];
            }
        }
        return s;
    };
    Stream.prototype.parseInteger = function (start, end) {
        var v = this.get(start), neg = (v > 127), pad = neg ? 255 : 0, len, s = '';
        while (v == pad && ++start < end)
            v = this.get(start);
        len = end - start;
        if (len === 0)
            return neg ? -1 : 0;
        if (len > 4) {
            var t = +v;
            len <<= 3;
            while (((t ^ pad) & 0x80) === 0) {
                t <<= 1;
                --len;
            }
            s = "(" + len + " bit)\n";
        }
        if (neg)
            v = v - 256;
        var n = new Int10(v);
        for (var i = start + 1; i < end; ++i)
            n.mulAdd(256, this.get(i));
        return s + n.toString();
    };
    Stream.prototype.parseBitString = function (start, end, maxLength) {
        var unusedBit = this.get(start), lenBit = ((end - start - 1) << 3) - unusedBit, intro = "(" + lenBit + " bit)\n", s = "";
        for (var i = start + 1; i < end; ++i) {
            var b = this.get(i), skip = (i == end - 1) ? unusedBit : 0;
            for (var j = 7; j >= skip; --j)
                s += (b >> j) & 1 ? "1" : "0";
            if (s.length > maxLength)
                return intro + stringCut(s, maxLength);
        }
        return intro + s;
    };
    Stream.prototype.parseOctetString = function (start, end, maxLength) {
        if (this.isASCII(start, end))
            return stringCut(this.parseStringISO(start, end), maxLength);
        var len = end - start, s = "(" + len + " byte)\n";
        maxLength /= 2;
        if (len > maxLength)
            end = start + maxLength;
        for (var i = start; i < end; ++i)
            s += this.hexByte(this.get(i));
        if (len > maxLength)
            s += ellipsis;
        return s;
    };
    Stream.prototype.parseOID = function (start, end, maxLength) {
        var s = '', n = new Int10(), bits = 0;
        for (var i = start; i < end; ++i) {
            var v = this.get(i);
            n.mulAdd(128, v & 0x7F);
            bits += 7;
            if (!(v & 0x80)) {
                if (s === '') {
                    n = n.simplify();
                    if (n instanceof Int10) {
                        n.sub(80);
                        s = "2." + n.toString();
                    }
                    else {
                        var m = n < 80 ? n < 40 ? 0 : 1 : 2;
                        s = m + "." + (n - m * 40);
                    }
                }
                else
                    s += "." + n.toString();
                if (s.length > maxLength)
                    return stringCut(s, maxLength);
                n = new Int10();
                bits = 0;
            }
        }
        if (bits > 0)
            s += ".incomplete";
        return s;
    };
    return Stream;
}());
var ASN1 = /** @class */ (function () {
    function ASN1(stream, header, length, tag, sub) {
        if (!(tag instanceof ASN1Tag))
            throw 'Invalid tag value.';
        this.stream = stream;
        this.header = header;
        this.length = length;
        this.tag = tag;
        this.sub = sub;
    }
    ASN1.decodeLength = function (stream) {
        var buf = stream.get();
        var len = buf & 0x7F;
        if (len == buf)
            return len;
        if (len > 6)
            throw "Length over 48 bits not supported at position " + (stream.pos - 1);
        if (len === 0)
            return null;
        buf = 0;
        for (var i = 0; i < len; ++i)
            buf = (buf * 256) + stream.get();
        return buf;
    };
    ASN1.decode = function (stream) {
        if (!(stream instanceof Stream))
            stream = new Stream(stream, 0);
        var streamStart = new Stream(stream);
        var tag = new ASN1Tag(stream);
        var len = ASN1.decodeLength(stream), sub = null;
        var start = stream.pos;
        var header = start - streamStart.pos;
        var getSub = function () {
            sub = [];
            if (len !== null) {
                var end = start + len;
                while (stream.pos < end)
                    sub[sub.length] = ASN1.decode(stream);
                if (stream.pos != end)
                    throw "Content size is not correct for container starting at offset " + start;
            }
            else {
                try {
                    for (;;) {
                        var s = ASN1.decode(stream);
                        if (s.tag.isEOC())
                            break;
                        sub[sub.length] = s;
                    }
                    len = start - stream.pos;
                }
                catch (e) {
                    throw "Exception while decoding undefined length content: " + e;
                }
            }
        };
        if (tag.tagConstructed) {
            getSub();
        }
        else if (tag.isUniversal() && ((tag.tagNumber == 0x03) || (tag.tagNumber == 0x04))) {
            try {
                if (tag.tagNumber == 0x03)
                    if (stream.get() != 0)
                        throw "BIT STRINGs with unused bits cannot encapsulate.";
                getSub();
                for (var i = 0; i < sub.length; ++i)
                    if (sub[i].tag.isEOC())
                        throw 'EOC is not supposed to be actual content.';
            }
            catch (e) {
                sub = null;
            }
        }
        if (sub === null) {
            if (len === null)
                throw "We can't skip over an invalid tag with undefined length at offset " + start;
            stream.pos = start + Math.abs(len);
        }
        return new ASN1(streamStart, header, len, tag, sub);
    };
    ASN1.prototype.typeName = function () {
        switch (this.tag.tagClass) {
            case 0:
                switch (this.tag.tagNumber) {
                    case 0x00:
                        return "EOC";
                    case 0x01:
                        return "BOOLEAN";
                    case 0x02:
                        return "INTEGER";
                    case 0x03:
                        return "BIT_STRING";
                    case 0x04:
                        return "OCTET_STRING";
                    case 0x05:
                        return "NULL";
                    case 0x06:
                        return "OBJECT_IDENTIFIER";
                    case 0x07:
                        return "ObjectDescriptor";
                    case 0x08:
                        return "EXTERNAL";
                    case 0x09:
                        return "REAL";
                    case 0x0A:
                        return "ENUMERATED";
                    case 0x0B:
                        return "EMBEDDED_PDV";
                    case 0x0C:
                        return "UTF8String";
                    case 0x10:
                        return "SEQUENCE";
                    case 0x11:
                        return "SET";
                    case 0x12:
                        return "NumericString";
                    case 0x13:
                        return "PrintableString";
                    case 0x14:
                        return "TeletexString";
                    case 0x15:
                        return "VideotexString";
                    case 0x16:
                        return "IA5String";
                    case 0x17:
                        return "UTCTime";
                    case 0x18:
                        return "GeneralizedTime";
                    case 0x19:
                        return "GraphicString";
                    case 0x1A:
                        return "VisibleString";
                    case 0x1B:
                        return "GeneralString";
                    case 0x1C:
                        return "UniversalString";
                    case 0x1E:
                        return "BMPString";
                }
                return "Universal_" + this.tag.tagNumber.toString();
            case 1:
                return "Application_" + this.tag.tagNumber.toString();
            case 2:
                return "[" + this.tag.tagNumber.toString() + "]";
            case 3:
                return "Private_" + this.tag.tagNumber.toString();
        }
    };
    ASN1.prototype.content = function (maxLength) {
        if (this.tag === undefined)
            return null;
        if (maxLength === undefined)
            maxLength = Infinity;
        var content = this.posContent(), len = Math.abs(this.length);
        if (!this.tag.isUniversal()) {
            if (this.sub !== null)
                return "(" + this.sub.length + " elem)";
            return this.stream.parseOctetString(content, content + len, maxLength);
        }
        switch (this.tag.tagNumber) {
            case 0x01:
                return (this.stream.get(content) === 0) ? "false" : "true";
            case 0x02:
                return this.stream.parseInteger(content, content + len);
            case 0x03:
                return this.sub ? "(" + this.sub.length + " elem)" :
                    this.stream.parseBitString(content, content + len, maxLength);
            case 0x04:
                return this.sub ? "(" + this.sub.length + " elem)" :
                    this.stream.parseOctetString(content, content + len, maxLength);
            case 0x06:
                return this.stream.parseOID(content, content + len, maxLength);
            case 0x10:
            case 0x11:
                if (this.sub !== null)
                    return "(" + this.sub.length + " elem)";
                else
                    return "(no elem)";
            case 0x0C:
                return stringCut(this.stream.parseStringUTF(content, content + len), maxLength);
            case 0x12:
            case 0x13:
            case 0x14:
            case 0x15:
            case 0x16:
            case 0x1A:
                return stringCut(this.stream.parseStringISO(content, content + len), maxLength);
            case 0x1E:
                return stringCut(this.stream.parseStringBMP(content, content + len), maxLength);
            case 0x17:
            case 0x18:
                return this.stream.parseTime(content, content + len, (this.tag.tagNumber == 0x17));
        }
        return null;
    };
    ASN1.prototype.toString = function () {
        return this.typeName() + "@" + this.stream.pos + "[header:" + this.header + ",length:" + this.length + ",sub:" + ((this.sub === null) ? 'null' : this.sub.length) + "]";
    };
    ASN1.prototype.posStart = function () {
        return this.stream.pos;
    };
    ASN1.prototype.posContent = function () {
        return this.stream.pos + this.header;
    };
    ASN1.prototype.posEnd = function () {
        return this.stream.pos + this.header + Math.abs(this.length);
    };
    ASN1.prototype.toHexString = function (root) {
        return this.stream.hexDump(this.posStart(), this.posEnd(), true);
    };
    ASN1.prototype.getHex = function () {
        return this.stream.hexDump(this.posContent(), this.posEnd(), true);
    };
    ASN1.prototype.getAB = function (clean) {
        if (clean === void 0) { clean = true; }
        return clean ? cleanZeros(hex2AB(this.getHex())) : hex2AB(this.getHex());
    };
    return ASN1;
}());
var ASN1Tag = /** @class */ (function () {
    function ASN1Tag(stream) {
        var buf = stream.get();
        this.tagClass = buf >> 6;
        this.tagConstructed = ((buf & 0x20) !== 0);
        this.tagNumber = buf & 0x1F;
        if (this.tagNumber == 0x1F) {
            var n = new Int10();
            do {
                buf = stream.get();
                n.mulAdd(128, buf & 0x7F);
            } while (buf & 0x80);
            this.tagNumber = n.simplify();
        }
    }
    ASN1Tag.prototype.isUniversal = function () {
        return this.tagClass === 0x00;
    };
    ASN1Tag.prototype.isEOC = function () {
        return this.tagClass === 0x00 && this.tagNumber === 0x00;
    };
    return ASN1Tag;
}());

var PEM = /** @class */ (function () {
    function PEM(secret) {
        var _this = this;
        if (typeof secret !== 'string') {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        this.type = 'public';
        var ignore = function (line) {
            if (ignoreLinesPriv.some(function (ign) { return line.toUpperCase().indexOf(ign) > -1; })) {
                _this.type = 'private';
                return false;
            }
            return !ignoreLinesPub.some(function (ign) { return line.toUpperCase().indexOf(ign) > -1; });
        };
        var lines = secret.split('\n'), ignoreLinesPriv = [
            '-BEGIN PRIVATE KEY-',
            '-END PRIVATE KEY-',
            '-BEGIN EC PRIVATE KEY-',
            '-END EC PRIVATE KEY-',
            '-BEGIN RSA PRIVATE KEY-',
            '-END RSA PRIVATE KEY-'
        ], ignoreLinesPub = [
            '-BEGIN RSA PUBLIC KEY-',
            '-BEGIN EC PUBLIC KEY-',
            '-BEGIN PUBLIC KEY-',
            '-END PUBLIC KEY-',
            '-END EC PUBLIC KEY-',
            '-END RSA PUBLIC KEY-'
        ], body = lines.map(function (line) { return line.trim(); }).filter(function (line) {
            return line.length && ignore(line);
        }).join('');
        if (body.length) {
            this.body = s2AB(b2s(bu2b(body)));
            return this;
        }
        else {
            throw new Error(ILLEGAL_ARGUMENT);
        }
    }
    return PEM;
}());

var ECCurves = [
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
var EC = /** @class */ (function () {
    function EC() {
    }
    EC.ASN1fromPEM = function (body) {
        if (!body)
            throw new Error(ILLEGAL_ARGUMENT);
        if (body instanceof ArrayBuffer)
            body = new Uint8Array(body);
        var asn1 = ASN1.decode(body);
        var res = {};
        if (asn1.sub.length === 3) {
            res['version'] = asn1.sub[0].content(); // int
            res['keyType'] = asn1.sub[1].sub[0].content(); // string
            res['namedCurve'] = asn1.sub[1].sub[1].content(); // string
            res['versionSub'] = asn1.sub[2].sub[0].sub[0].content(); // int
            res['privateKey'] = asn1.sub[2].sub[0].sub[2].getAB(); // ArrayBuffer
            res['curveTypeSub'] = asn1.sub[2].sub[0].sub[2].sub[0].content(); // string
            res['publicKey'] = asn1.sub[2].sub[0].sub[3].sub[0].getAB(); // ArrayBuffer
        }
        else if (asn1.sub.length === 2) {
            res['keyType'] = asn1.sub[0].sub[0].content(); // string
            res['namedCurve'] = asn1.sub[0].sub[1].content(); // string
            res['publicKey'] = asn1.sub[1].getAB(); // int
        }
        return asn1;
    };
    EC.JWKfromASN1 = function (asn1, type, extra) {
        var pemTypes = ['public', 'private'];
        if (!asn1)
            throw new Error(ILLEGAL_ARGUMENT);
        type = ((typeof type === 'string') && type.toLowerCase())
            || pemTypes[!!asn1.privateKey ? 1 : 0];
        if (type === 'private' && !asn1.privateKey) {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        var crv = ECCurves.find(function (c) { return c.curve === asn1.namedCurve; });
        if (!crv) {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        var publicKey = asn1.publicKey;
        if (publicKey.readInt8(0) !== 4) {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        var jwk = Object.assign({ kty: 'EC', crv: crv.name }, extra, {
            x: s2bu(AB2s(publicKey.slice(1, crv.coordinateLength))),
            y: s2bu(AB2s(publicKey.slice(crv.coordinateLength + 1, 2 * (crv.coordinateLength + 1))))
        });
        if (type === 'private') {
            Object.assign(jwk, {
                d: s2bu(AB2s(asn1.privateKey))
            });
        }
        return jwk;
    };
    EC.JWKfromEC = function (secret, type, extra) {
        return tryPromise(function () {
            var pem = new PEM(secret);
            return EC.JWKfromASN1(EC.ASN1fromPEM(pem.body), type, extra);
        });
    };
    return EC;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var webCrypto = typeof window === "object" && (window.crypto || window['msCrypto']);
var webCryptoSubtle = webCrypto && (webCrypto.subtle || webCrypto['webkitSubtle'] || webCrypto['Subtle']);
var HMAC = /** @class */ (function () {
    function HMAC() {
    }
    HMAC.createSigner = function (name, secret) {
        return __awaiter(this, void 0, void 0, function () {
            var keyData;
            return __generator(this, function (_a) {
                if (webCryptoSubtle) {
                    keyData = s2AB(secret);
                    return [2 /*return*/, webCryptoSubtle.importKey('raw', keyData, { name: 'HMAC', hash: { name: name } }, true, ['sign']).then(function (key) {
                            return {
                                update: function (thing) {
                                    return __awaiter(this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            return [2 /*return*/, webCryptoSubtle.sign('HMAC', key, s2AB(thing))];
                                        });
                                    });
                                }
                            };
                        })];
                }
                else {
                    return [2 /*return*/, !!crypto && crypto.createHmac ? Promise.resolve(crypto.createHmac(name.replace('SHA-', 'sha'), secret)) : Promise.reject(webCrypto)];
                }
                return [2 /*return*/];
            });
        });
    };
    HMAC.sign = function (bits) {
        return function sign(thing, secret) {
            return __awaiter(this, void 0, void 0, function () {
                var hmac, _a, _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, HMAC.createSigner('SHA-' + bits, secret)];
                        case 1:
                            hmac = _g.sent();
                            _b = (_a = Promise).resolve;
                            if (!webCryptoSubtle) return [3 /*break*/, 4];
                            _d = s2bu;
                            _e = AB2s;
                            _f = hmac;
                            if (!_f) return [3 /*break*/, 3];
                            return [4 /*yield*/, hmac.update(thing)];
                        case 2:
                            _f = (_g.sent());
                            _g.label = 3;
                        case 3:
                            _c = _d.apply(void 0, [_e.apply(void 0, [_f])]);
                            return [3 /*break*/, 5];
                        case 4:
                            _c = b2bu(hmac && hmac.update(thing).digest('base64'));
                            _g.label = 5;
                        case 5: return [2 /*return*/, _b.apply(_a, [_c])];
                    }
                });
            });
        };
    };
    HMAC.verify = function (bits) {
        return function verify(thing, signature, secret) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, HMAC.sign(bits)(thing, secret)];
                        case 1: return [2 /*return*/, (_a.sent()) === signature];
                    }
                });
            });
        };
    };
    return HMAC;
}());

var webCrypto$1 = typeof window === "object" && (window.crypto || window['msCrypto']);
var webCryptoSubtle$1 = webCrypto$1 && (webCrypto$1.subtle || webCrypto$1['webkitSubtle'] || webCrypto$1['Subtle']);
var RSA = /** @class */ (function () {
    function RSA() {
    }
    RSA.ASN1fromPEM = function (body) {
        if (!body)
            throw new Error(ILLEGAL_ARGUMENT);
        if (body instanceof ArrayBuffer)
            body = new Uint8Array(body);
        var asn1 = ASN1.decode(body), res = {};
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
        }
        else if (asn1.sub.length === 2) {
            // Parse the public key.
            asn1 = asn1.sub[1].sub[0];
            res['modulus'] = asn1.sub[0].getAB(); // ArrayBuffer
            res['publicExponent'] = parseInt(asn1.sub[1].getHex(), 16); // int
        }
        res['bits'] = (res['modulus'].length - 1) * 8 + Math.ceil(Math.log(res['modulus'][0] + 1) / Math.log(2));
        if (!res['bits']) {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        return res;
    };
    RSA.JWKfromASN1 = function (asn1, type, extra) {
        var pemTypes = ['public', 'private'];
        if (!asn1)
            throw new Error(ILLEGAL_ARGUMENT);
        type = ((typeof type === 'string') && type.toLowerCase())
            || pemTypes[!!asn1.privateExponent ? 1 : 0];
        if (type === 'private' && !asn1.privateExponent) {
            throw new Error(ILLEGAL_ARGUMENT);
        }
        var v = asn1.publicExponent;
        var expSize = Math.ceil(Math.log(v) / Math.log(256));
        var exp = new Uint8Array(expSize).map(function (el) {
            el = v % 256;
            v = Math.floor(v / 256);
            return el;
        }).reverse();
        var jwk = Object.assign({ kty: 'RSA' }, extra, {
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
    };
    RSA.JWKfromRSA = function (secret, type, extra) {
        return tryPromise(function () {
            var pem = new PEM(secret);
            return RSA.JWKfromASN1(RSA.ASN1fromPEM(pem.body), type, extra);
        });
    };
    RSA.createSigner = function (name) {
        if (webCryptoSubtle$1) {
            return {
                update: function (thing) {
                    return {
                        sign: function (secret, encoding) {
                            return __awaiter(this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, RSA.JWKfromRSA(secret, 'private', {
                                            key_ops: ['sign'],
                                            alg: name.replace('SHA-', 'RS')
                                        }).then(function (keyData) { return __awaiter(_this, void 0, void 0, function () {
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                return [2 /*return*/, webCryptoSubtle$1.importKey('jwk', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: { name: name } }, true, ['sign']).then(function (key) { return __awaiter(_this, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            return [2 /*return*/, webCryptoSubtle$1.sign({ name: 'RSASSA-PKCS1-v1_5', hash: { name: name } }, key, s2AB(thing)).then(AB2s).then(s2b)];
                                                        });
                                                    }); })];
                                            });
                                        }); })];
                                });
                            });
                        }
                    };
                }
            };
        }
        else {
            if (crypto && crypto.createSign) {
                return crypto.createSign(name.replace('SHA-', 'RSA-SHA'));
            }
            else {
                throw new Error(ILLEGAL_ARGUMENT);
            }
        }
    };
    RSA.sign = function (bits) {
        return function sign(thing, privateKey) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, tryPromise(function () {
                            return RSA.createSigner('SHA-' + bits)
                                .then(function (res) { return res
                                .update(thing)
                                .sign(privateKey, 'base64')
                                .then(b2bu); });
                        })];
                });
            });
        };
    };
    RSA.createVerifier = function (name) {
        if (webCryptoSubtle$1) {
            return {
                update: function (thing) {
                    return {
                        verify: function (secret, signature, encoding) {
                            return __awaiter(this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, RSA.JWKfromRSA(secret, 'public', {
                                            key_ops: ['verify'],
                                            alg: name.replace('SHA-', 'RS')
                                        }).then(function (_a) {
                                            var kty = _a.kty, n = _a.n, e = _a.e;
                                            return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_b) {
                                                    return [2 /*return*/, webCryptoSubtle$1.importKey('jwk', { kty: kty, n: n, e: e }, { name: 'RSASSA-PKCS1-v1_5', hash: { name: name } }, false, ['verify']).then(function (key) {
                                                            return webCryptoSubtle$1.verify('RSASSA-PKCS1-v1_5', key, s2AB(bu2s(signature)), s2AB(thing));
                                                        })];
                                                });
                                            });
                                        })];
                                });
                            });
                        }
                    };
                }
            };
        }
        else {
            if (crypto && crypto.createVerify) {
                return crypto.createVerify(name.replace('SHA-', 'RSA-SHA'));
            }
            else {
                throw new Error(ILLEGAL_ARGUMENT);
            }
        }
    };
    RSA.verify = function (bits) {
        return function verify(thing, signature, publicKey) {
            return __awaiter(this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, RSA.createVerifier('SHA-' + bits)
                                    .then(function (res) { return res
                                    .update(thing)
                                    .verify(publicKey, bu2b(signature), 'base64'); })];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            e_1 = _a.sent();
                            return [2 /*return*/, Promise.reject(new Error(e_1.message))];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
    };
    return RSA;
}());

var jwkJs = {
    ASN1: ASN1,
    EC: EC,
    PEM: PEM,
    RSA: RSA,
    HMAC: HMAC,
    ILLEGAL_ARGUMENT: ILLEGAL_ARGUMENT,
    UNSUPPORTED_ALGORITHM: UNSUPPORTED_ALGORITHM,
    tryPromise: tryPromise,
    AB2hex: AB2hex,
    AB2s: AB2s,
    b2bu: b2bu,
    b2s: b2s,
    bu2b: bu2b,
    bu2s: bu2s,
    cleanZeros: cleanZeros,
    hex2AB: hex2AB,
    num2hex: num2hex,
    s2AB: s2AB,
    s2b: s2b,
    s2bu: s2bu
};

export default jwkJs;
export { jwkJs };
//# sourceMappingURL=jwk-js.esm.js.map
