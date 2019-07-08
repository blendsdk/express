import { Request, Response, RequestHandler } from "express";
import { validationResult, Result } from "express-validator";
import { HttpStatus } from "./HttpStatus";
import { isString } from "@blendsdk/stdlib/dist/isString";

/**
 * Type describing a Request and Response handler
 */
export type TRequestHandler = (req?: Request, res?: Response) => void

/**
 * Interface describing an Error Response
 *
 * @export
 * @interface IResponseError
 */
export interface IResponseError {
    error?: boolean;
    code?: number;
    type?: string;
    message: any
}

/**
 * Http Response Wrapper
 *
 * @export
 * @class HttpResponse
 */
export class HttpResponse {
    /**
     * Internal Response object
     *
     * @protected
     * @type {Response}
     * @memberof HttpResponse
     */
    protected response: Response;
    /**
     * Internal Request object
     *
     * @protected
     * @type {Request}
     * @memberof HttpResponse
     */
    protected request: Request;

    /**
     * Creates an instance of HttpResponse.
     * @param {Response} response
     * @memberof HttpResponse
     */
    public constructor(res: Response) {
        this.response = res;
        this.request = res.req;
    }

    /**
     * Provides an OK response.
     *
     * @template T
     * @param {Response} res
     * @param {T} data
     * @returns {Response}
     * @memberof HttpResponse
     */
    public OK<T extends any>(data: T): Response {
        return this.response.status(HttpStatus.Success.OK).json(data);
    }

    protected parseError(error: Error | string): any {
        const err: Error = isString(error) ? new Error(error as string) : error as Error
        return {
            ...err
        }
    }

    /**
     * Creates a validation error response.
     *
     * @param {Result<any>} errors
     * @returns
     * @memberof HttpResponse
     */
    public validationError(errors: Result<any>) {
        debugger;
        return this.error({
            code: HttpStatus.ClientErrors.BadRequest,
            type: "VALIDATION_ERROR",
            message: errors.array()
        });
    }

    /**
     * Provides an error response.
     *
     * @param {number} code
     * @param {(any | any[])} error
     * @returns {Response}
     * @memberof HttpResponse
     */
    public error(err: IResponseError): Response {
        err.error = true;
        return this.response.status(err.code).json(err);
    }

    /**
     * Sends an InternalServerError (500) response
     *
     * @param {(any | any[])} error
     * @returns {Response}
     * @memberof HttpResponse
     */
    public serverError(error: Error | string): Response {
        return this.error({
            code: HttpStatus.ServerErrors.InternalServerError,
            type: "SERVER_ERROR",
            message: this.parseError(error)
        });
    }

    /**
     * Send an Unauthorized error response
     *
     * @param {(any | any[])} error
     * @returns {Response}
     * @memberof HttpResponse
     */
    public unAuthorized(error: Error | string): Response {
        return this.error({
            code: HttpStatus.ClientErrors.Unauthorized,
            type: "AUTH_ERROR",
            message: this.parseError(error)
        });
    }
}

/**
 * Higher order function for providing field validation check.
 *
 * @export
 * @param {TRequestHandler} callback
 * @returns {Function}
 */
export function withRequestValidation(callback: TRequestHandler): RequestHandler {
    return (req: Request, res: Response) => {
        try {
            let errors = validationResult(req);
            if (errors.isEmpty()) {
                callback(req, res);
            } else {
                response(res).validationError(errors);
            }
        } catch (err) {
            response(res).serverError(err)
        }
    }
}

/**
 * Returns the authenticated user object from the Request.
 *
 * @export
 * @template T
 * @param {Request} req
 * @returns {T}
 */
export function authenticatedUser<T>(req: Request): T {
    return (req as any).user || (null as T);
}

/**
 * The HttpResponse instance builder.
 * @param res
 */
export const response = (res: Response): HttpResponse => {
    return new HttpResponse(res);
};
