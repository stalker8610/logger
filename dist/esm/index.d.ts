import { LoggingModes, MessagesTypes } from './types.js';
export declare class Logger {
    private readonly basicPath;
    private mode;
    private readonly maxLogSize;
    private readonly verbose;
    private writeStream;
    constructor(basicPath: string, mode?: LoggingModes, maxLogSize?: number, verbose?: boolean);
    setMode(mode: LoggingModes): void;
    log(text: string, type?: MessagesTypes, sync?: boolean): void;
    info(message: string, sync?: boolean): void;
    warn(message: string, sync?: boolean): void;
    error(message: string, sync?: boolean): void;
    close(): void;
    private isMessageApproachesTheMode;
    private writeMessageToFile;
    private writeMessageToFileSync;
}
