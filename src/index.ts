import * as fs from 'fs';
import { format } from 'util';

export enum LoggingModes {
    DEBUG_MODE = 0,
    STANDARD_MODE = 1
}

enum MessagesTypes {
    INFO = 0,
    WARN = 1,
    ERROR = 2
}

type Message = {
    text: string,
    type: MessagesTypes,
    timeStamp: Date
}

function maxKeyLengthOf(o: Object): number {
    let keys = Object.keys(o);
    return keys.reduce((maxLength: number, cur: string) => cur.length > maxLength ? cur.length : maxLength, 0);
}

const messagesTypesMaxLength = maxKeyLengthOf(MessagesTypes);
const timezoneOffsetSeconds = new Date().getTimezoneOffset() * 60;


export class Logger {

    private writeStream: fs.WriteStream = null;

    constructor(private readonly basicPath: string,
        private mode = LoggingModes.STANDARD_MODE,
        private readonly maxLogSize = 0,
        private readonly verbose = false,
        autoClose = true) {

        if (autoClose) {
            process.on('exit', () => {
                this.close();
            });
        }

    }

    setMode(mode: LoggingModes) {
        this.mode = mode;
    }

    log(text: string, type: MessagesTypes = MessagesTypes.INFO, sync = false) {
        if (this.isMessageApproachesTheMode(type)) {
            const newMessage = {
                text,
                type,
                timeStamp: applyTimeZone(new Date())
            }
            if (this.verbose) {
                console.log(formatMessage(newMessage));
            }
            this.writeMessageToFile(newMessage, sync)
        }
    }

    info(message: string, sync = false) {
        this.log(message, MessagesTypes.INFO, sync);
    }

    warn(message: string, sync = false) {
        this.log(message, MessagesTypes.WARN, sync);
    }

    error(message: string, sync = false) {
        this.log(message, MessagesTypes.ERROR, sync);
    }

    private isMessageApproachesTheMode(messageType: MessagesTypes) {
        return (messageType >= this.mode)
    }

    close() {
        if (this.writeStream && !this.writeStream.closed) {
            this.writeStream.close();
        }
    }

    private writeMessageToFile(message: Message, sync: boolean) {
        if (sync) {
            this.writeMessageToFileSync(message);
        } else {
            setImmediate(() => {
                this.writeMessageToFileSync(message);
            })
        }
    }

    private writeMessageToFileSync(message: Message) {

        if (!this.writeStream || this.writeStream.closed) {
            const dirPath = this.basicPath.substring(0, this.basicPath.lastIndexOf('\\'));
            const formattedTimestamp = applyTimeZone(new Date()).toISOString().replace(/-|T|:/g, '').replace(/\..+/, '');
            const filePath = this.basicPath.replace(/\.log/, '') + formattedTimestamp + '.log';
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            this.writeStream = fs.createWriteStream(filePath, { flags: 'w' });
        }

        const formattedMessage = formatMessage(message);

        if (this.writeStream.pending) {
            this.writeStream.on('ready', () => {
                this.writeStream.write(formattedMessage, () => {
                    if (this.maxLogSize && fs.statSync(this.writeStream.path).size >= this.maxLogSize) {
                        this.writeStream.close();
                    }
                });
            })
        } else {
            this.writeStream.write(formattedMessage, () => {
                if (this.maxLogSize && fs.statSync(this.writeStream.path).size >= this.maxLogSize) {
                    this.writeStream.close();
                }
            });
        }

    }

}

function applyTimeZone(date: Date) {
    date.setSeconds(date.getSeconds() - timezoneOffsetSeconds);
    return date;
}

function formatDate(date: Date) {
    let s = date.toISOString().replace(/T/, ' ')
    return s.substring(0, s.length - 5);
}

function formatMessage(message: Message) {
    const formattedDate = formatDate(message.timeStamp);
    const formattedMessageType = MessagesTypes[message.type].padEnd(messagesTypesMaxLength, ' ');
    return format('%s - %s - %s\n', formattedDate, formattedMessageType, message.text);
}