import winston from "winston";
import { isString } from "@blendsdk/stdlib/dist/isString";

/** */
let _logger: winston.Logger;

class Logger {
    /**
     * Reference to the registered winston logger
     *
     * @protected
     * @type {winston.Logger}
     * @memberof Logger
     */
    protected logger: winston.Logger;

    /**
     * Registers a winston logger for this class
     *
     * @param {winston.Logger} logger
     * @memberof Logger
     */
    public registerLogger(logger: winston.Logger) {
        this.logger = logger;
    }

    /**
     * Writes an error log
     *
     * @param {string} message
     * @param {...any[]} args
     * @memberof Logger
     */
    public error(message: string | any, ...args: any[]) {
        if (this.logger) {
            this.logger.error(message as any, ...args);
        }
    }

    /**
     * Writes a warning log
     *
     * @param {string} message
     * @param {...any[]} args
     * @memberof Logger
     */
    public warn(message: string, ...args: any[]) {
        if (this.logger) {
            this.logger.warn(message, ...args);
        }
    }

    /**
     * Writes a debug log
     *
     * @param {string} message
     * @param {...any[]} args
     * @memberof Logger
     */
    public debug(message: string, ...args: any[]) {
        if (this.logger) {
            this.logger.debug(message, ...args);
        }
    }

    /**
     * Writes an informational log
     *
     * @param {string} message
     * @param {...any[]} args
     * @memberof Logger
     */
    public info(message: string, ...args: any[]) {
        if (this.logger) {
            this.logger.info(message, ...args);
        }
    }
}

/**
 * Create an instance of the logger for exporting
 */
const logger = new Logger();

export { logger };