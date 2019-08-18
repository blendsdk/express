import { apply, IDictionary, isInstanceOf } from "@blendsdk/stdlib";
import { isString } from "@blendsdk/stdlib/dist/isString";
import { Request, RequestHandler, Response } from "express";
import { Result, validationResult } from "express-validator";
import { HttpStatus } from "./HttpStatus";
import { logger } from "./Logger";

/**
 * Type describing a Request and Response handler
 */
export type TRequestHandler = (req?: Request, res?: Response) => void;

/**
 * Interface describing an Error Response
 *
 * @export
 * @interface IResponseError
 */
export interface IErrorResponse {
    error: boolean;
    code: number;
    type: string;
    message: string;
    metaData: IDictionary;
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

    /**
     * Create metadata information from an Error object
     *
     * @protected
     * @param {Error} error
     * @returns {IDictionary}
     * @memberof HttpResponse
     */
    protected getErrorMetaData(error: Error): IDictionary {
        if (isInstanceOf(error, Error)) {
            return {
                name: error.name,
                stack: error.stack
            };
        } else {
            return {};
        }
    }

    /**
     * Creates an Error Response
     *
     * @protected
     * @param {(Error | string)} error
     * @param {number} errorCode
     * @param {string} errorType
     * @returns {IErrorResponse}
     * @memberof HttpResponse
     */
    protected createErrorResponse(error: Error | string, errorCode: number, errorType: string): IErrorResponse {
        return {
            error: true,
            code: errorCode,
            type: errorType,
            message: isInstanceOf(error, Error) ? (error as Error).message : (error as string),
            metaData: isInstanceOf(error, Error) ? this.getErrorMetaData(error as Error) : {}
        };
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
        const err = new Error(
            errors
                .array()
                .map((e: any) => {
                    return e.msg;
                })
                .join("\n")
        );
        err.stack = errors.mapped() as any;
        return this.error(this.createErrorResponse(err, HttpStatus.ClientErrors.BadRequest, "VALIDATION_ERROR"));
    }

    /**
     * Provides an error response.
     *
     * @param {number} code
     * @param {(any | any[])} error
     * @returns {Response}
     * @memberof HttpResponse
     */
    public error(err: IErrorResponse): Response {
        logger.error(err);
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
        return this.error(this.createErrorResponse(error, HttpStatus.ServerErrors.InternalServerError, "SERVER_ERROR"));
    }

    /**
     * Send an Unauthorized error response
     *
     * @param {(any | any[])} error
     * @returns {Response}
     * @memberof HttpResponse
     */
    public unAuthorized(error: Error | string): Response {
        return this.error(
            this.createErrorResponse(error, HttpStatus.ClientErrors.Unauthorized, "AUTHENTICATION_ERROR")
        );
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
            const errors = validationResult(req);
            if (errors.isEmpty()) {
                callback(req, res);
            } else {
                response(res).validationError(errors);
            }
        } catch (err) {
            response(res).serverError(err);
        }
    };
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

/**
 * Returns on object that is merged from the values
 * provided from request body,params, and query
 *
 * @param req
 */
export const getParameters = <T>(req: Request): T => {
    return {
        ...req.body,
        ...req.params,
        ...req.query
    } as T;
};
