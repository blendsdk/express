import { forEach, isNullOrUndefDefault, wrapInArray } from "@blendsdk/stdlib";
import { Express, Request, Response } from "express";
import { RequestHandler } from "express-serve-static-core";
import { check, param, ValidationChain } from "express-validator";
import { HttpResponse, withRequestValidation } from "./HttpResponse";
import { is_authenticated } from "./IsAuthenticated";

/**
 * Type describing REST methods
 */
export type TRouteMethod = "get" | "post" | "patch" | "delete";
/**
 * Type describing the REST parameter types
 */
export type TRouteParameter = "string" | "number" | "boolean";
/**
 * Type describing a controller method
 */
export type TRouteController = (req: Request, res: Response) => Promise<void> | HttpResponse;

/**
 * Interface describing a route parameter
 *
 * @export
 * @interface IRouteParameter
 */
export interface IRouteParameter {
    type: TRouteParameter;
    message?: string;
    optional?: boolean;
}

/**
 * Interface describing a route
 *
 * @export
 * @interface IRoute
 */
export interface IRoute {
    method: TRouteMethod;
    endpoint: string;
    secure?: boolean;
    controller: TRouteController;
    middlewares?: RequestHandler[];
    parameters: {
        [name: string]: IRouteParameter;
    };
}

/**
 * Checks and sets the validation "optional" flag
 *
 * @param {ValidationChain} checker
 * @param {IRouteParameter} param
 */
function checkSetOptionalParameter(checker: ValidationChain, param: IRouteParameter) {
    if (param.optional) {
        checker = checker.optional();
    }
}

/**
 * Check and set the route parameter validation type
 *
 * @param {ValidationChain} checker
 * @param {IRouteParameter} param
 */
function checkSetParameterType(checker: ValidationChain, param: IRouteParameter) {
    switch (param.type) {
        case "number":
            checker = checker.isNumeric();
            break;
        case "boolean":
            checker = checker.isBoolean();
            break;
        default:
            checker = checker.isString();
    }
}

/**
 * Build route handler based on an IRoute configuration
 *
 * @param {IRoute} route
 * @returns {RequestHandler[]}
 */
function buildHandlers(route: IRoute): RequestHandler[] {
    const result: RequestHandler[] = [];
    route.secure = isNullOrUndefDefault(route.secure, true);
    route.parameters = route.parameters || {};
    // check if secure is needed
    if (route.secure) {
        result.push(is_authenticated);
    }
    // set parameter validation
    Object.keys(route.parameters).forEach((paramName: string) => {
        const param: IRouteParameter = route.parameters[paramName];
        console.log(param);
        const checker = check(paramName, param.message);
        checkSetParameterType(checker, param);
        checkSetOptionalParameter(checker, param);
        result.push(checker);
    });
    // set the user defined middle wares
    wrapInArray<RequestHandler>(route.middlewares || []).forEach(m => {
        result.push(m);
    });
    // adds the validation middle ware
    result.push(
        Object.keys(route.parameters).length === 0 ? route.controller : withRequestValidation(route.controller)
    );
    return result;
}

/**
 * Build the routes based on an array of IRoute configuration
 *
 * @export
 * @param {Express} app
 * @param {(IRoute | IRoute[])} route
 */
export function buildRoutes(app: Express, route: IRoute | IRoute[]) {
    wrapInArray<IRoute>(route).forEach(route => {
        app[route.method](route.endpoint, ...buildHandlers(route));
    });
}
