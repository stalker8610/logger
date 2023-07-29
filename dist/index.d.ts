export declare enum LoggingModes {
    DEBUG_MODE = 0,
    STANDARD_MODE = 1
}
declare enum MessagesTypes {
    INFO = 0,
    WARN = 1,
    ERROR = 2
}
export declare class Logger {
    private readonly basicPath;
    private mode;
    private readonly maxLogSize;
    private writeStream;
    constructor(basicPath: string, mode?: LoggingModes, maxLogSize?: number, autoClose?: boolean);
    setMode(mode: LoggingModes): void;
    log(text: string, type?: MessagesTypes, sync?: boolean): void;
    info(message: string, sync?: boolean): void;
    warn(message: string, sync?: boolean): void;
    error(message: string, sync?: boolean): void;
    private isMessageApproachesTheMode;
    close(): void;
    private writeMessageToFile;
    private writeMessageToFileSync;
}
export {};
