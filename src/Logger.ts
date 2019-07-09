import winston from "winston";

/** */
let _logger: winston.Logger;

/**
 * Sets a winston logger instance
 *
 * @export
 * @param {winston.Logger} logger
 */
export function registerLogger(logger: winston.Logger) {
    _logger = logger;
}

/**
 * Gets the current logger instance
 *
 * @export
 * @returns {winston.Logger}
 */
export function getLogger(): winston.Logger {
    return _logger || null;
}