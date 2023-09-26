export declare enum LoggingModes {
    DEBUG_MODE = 0,
    STANDARD_MODE = 1
}
export declare enum MessagesTypes {
    INFO = 0,
    WARN = 1,
    ERROR = 2
}
export type Message = {
    text: string;
    type: MessagesTypes;
    timeStamp: Date;
};
