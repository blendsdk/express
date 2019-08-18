import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * Interface for returning the token to the requester
 *
 * @export
 * @interface IJwtTokenResult
 */
export interface IJwtTokenResult {
    success: true;
    token: string;
}

/**
 * Interface for describing a minimal JWT
 *
 * @export
 * @interface JWTData
 */
export interface JWTData {
    maxAge?: number;
    [name: string]: any;
}

/**
 * Encrypt the JWT token¸
 *
 * @param {string} data
 * @returns {string}
 */
function encryptData(data: string): string {
    try {
        const cipher = crypto.createCipher("aes-256-cbc", getJWTSecret());
        return Buffer.concat([cipher.update(new Buffer(data, "utf8")), cipher.final()]).toString("hex");
    } catch (exception) {
        throw new Error(exception.message);
    }
}

/**
 * Decrypt the JWT token
 *
 * @param {string} data
 * @returns
 */
function decryptData(data: string) {
    try {
        const decipher = crypto.createDecipher("aes-256-cbc", getJWTSecret());
        return Buffer.concat([decipher.update(new Buffer(data, "hex")), decipher.final()]).toString();
    } catch (exception) {
        throw new Error(exception.message);
    }
}

/**
 * Create and encode data as JWT
 *
 * @export
 * @param {JWTData} details
 * @returns {string}
 */
export function createJWToken(details: JWTData): string {
    details = details || {};
    details.sessionData = details.sessionData || {};
    details.maxAge = parseInt((details.maxAge || process.env.JWT_MAX_AGE || 3600) as any);
    delete details.password; // in case!
    return encryptData(
        jwt.sign(
            {
                data: details.sessionData
            },
            getJWTSecret(),
            {
                expiresIn: details.maxAge,
                algorithm: "HS256"
            }
        )
    );
}

/**
 * Get the JWT_SECRET provided from the .env file.
 *
 * @returns {string}
 */
export function getJWTSecret(): string {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    } else {
        console.log("WARN: No JWT token was provided from .env!");
        return process.cwd();
    }
}

/**
 * Verify a JWT against a configures secret.
 *
 * @export
 * @param {string} token
 * @returns
 */
export function verifyJWTToken(token: string) {
    return new Promise((resolve, reject) => {
        jwt.verify(decryptData(token), getJWTSecret(), (err, decodedToken) => {
            if (err || !decodedToken) {
                return reject(err);
            }
            resolve(decodedToken);
        });
    });
}

/**
 * Check if the current request is from an authenticated user.
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function is_authenticated(req: Request, res: Response, next: NextFunction) {
    verifyJWTToken((req as any).token)
        .then((decodedToken: any) => {
            (req as any).user = decodedToken.data;
            next();
        })
        .catch(() => {
            res.status(400).json({ message: "Invalid auth token provided." });
        });
}
