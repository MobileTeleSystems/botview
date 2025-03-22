import { LoggerService } from "@nestjs/common";
import { hostname } from "os";

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
