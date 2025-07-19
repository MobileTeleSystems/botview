import { LoggerService } from "@nestjs/common";
import { hostname } from "os";
import { config } from "../config";

export enum LogLevels {
    FATAL = 60,
    ERROR = 50,
    WARN = 40,
    INFO = 30,
    DEBUG = 20,
    TRACE = 10,
}

export class JsonLogger implements LoggerService {
    protected hostname: string = hostname();
    private minLogLevel: number;

    constructor() {
        // Получаем минимальный уровень логирования из конфигурации
        this.minLogLevel = config.logLevel;
    }

    /**
     * Write a 'log' level log.
     */
    public log(message: string) {
        this.writeJson(message, LogLevels.INFO);
    }

    /**
     * Write an 'error' level log.
     */
    public error(message: string) {
        this.writeJson(message, LogLevels.ERROR);
    }

    /**
     * Write a 'fatal' level log.
     */
    public fatal(message: string) {
        this.writeJson(message, LogLevels.FATAL);
    }

    /**
     * Write a 'warn' level log.
     */
    public warn(message: string) {
        this.writeJson(message, LogLevels.WARN);
    }

    /**
     * Write a 'debug' level log.
     */
    public debug(message: string) {
        this.writeJson(message, LogLevels.DEBUG);
    }

    /**
     * Write a 'verbose' level log.
     */
    public verbose(message: string) {
        this.writeJson(message, LogLevels.TRACE);
    }

    /**
     * Write a 'trace' level log.
     */
    public trace(message: string) {
        this.writeJson(message, LogLevels.TRACE);
    }

    public extraLogs(
        message: string,
        level: number,
        extraProps: object = {},
    ): void {
        this.writeJson(message, level, extraProps);
    }

    protected writeJson(
        message: string,
        level: number,
        extraProps: object = {},
    ): void {
        // Проверяем, нужно ли выводить лог в зависимости от уровня
        if (level < this.minLogLevel) {
            return;
        }

        console.log(
            JSON.stringify({
                message: message,
                ...extraProps,
                time: Date.now(),
                level: level,
                hostname: this.hostname,
                service: "botview",
            }),
        );
    }
}
