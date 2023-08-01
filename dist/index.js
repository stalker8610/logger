import * as fs from 'fs';
import { format } from 'util';
export var LoggingModes;
(function (LoggingModes) {
    LoggingModes[LoggingModes["DEBUG_MODE"] = 0] = "DEBUG_MODE";
    LoggingModes[LoggingModes["STANDARD_MODE"] = 1] = "STANDARD_MODE";
})(LoggingModes || (LoggingModes = {}));
var MessagesTypes;
(function (MessagesTypes) {
    MessagesTypes[MessagesTypes["INFO"] = 0] = "INFO";
    MessagesTypes[MessagesTypes["WARN"] = 1] = "WARN";
    MessagesTypes[MessagesTypes["ERROR"] = 2] = "ERROR";
})(MessagesTypes || (MessagesTypes = {}));
function maxKeyLengthOf(o) {
    let keys = Object.keys(o);
    return keys.reduce((maxLength, cur) => cur.length > maxLength ? cur.length : maxLength, 0);
}
const messagesTypesMaxLength = maxKeyLengthOf(MessagesTypes);
const timezoneOffsetSeconds = new Date().getTimezoneOffset() * 60;
export class Logger {
    constructor(basicPath, mode = LoggingModes.STANDARD_MODE, maxLogSize = 0, verbose = false, autoClose = true) {
        this.basicPath = basicPath;
        this.mode = mode;
        this.maxLogSize = maxLogSize;
        this.verbose = verbose;
        this.writeStream = null;
        if (autoClose) {
            process.on('exit', () => {
                this.close();
            });
        }
    }
    setMode(mode) {
        this.mode = mode;
    }
    log(text, type = MessagesTypes.INFO, sync = false) {
        if (this.isMessageApproachesTheMode(type)) {
            const newMessage = {
                text,
                type,
                timeStamp: applyTimeZone(new Date())
            };
            if (this.verbose) {
                console.log(formatMessage(newMessage));
            }
            this.writeMessageToFile(newMessage, sync);
        }
    }
    info(message, sync = false) {
        this.log(message, MessagesTypes.INFO, sync);
    }
    warn(message, sync = false) {
        this.log(message, MessagesTypes.WARN, sync);
    }
    error(message, sync = false) {
        this.log(message, MessagesTypes.ERROR, sync);
    }
    isMessageApproachesTheMode(messageType) {
        return (messageType >= this.mode);
    }
    close() {
        if (this.writeStream && !this.writeStream.closed) {
            this.writeStream.close();
        }
    }
    writeMessageToFile(message, sync) {
        if (sync) {
            this.writeMessageToFileSync(message);
        }
        else {
            setImmediate(() => {
                this.writeMessageToFileSync(message);
            });
        }
    }
    writeMessageToFileSync(message) {
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
            });
        }
        else {
            this.writeStream.write(formattedMessage, () => {
                if (this.maxLogSize && fs.statSync(this.writeStream.path).size >= this.maxLogSize) {
                    this.writeStream.close();
                }
            });
        }
    }
}
function applyTimeZone(date) {
    date.setSeconds(date.getSeconds() - timezoneOffsetSeconds);
    return date;
}
function formatDate(date) {
    let s = date.toISOString().replace(/T/, ' ');
    return s.substring(0, s.length - 5);
}
function formatMessage(message) {
    const formattedDate = formatDate(message.timeStamp);
    const formattedMessageType = MessagesTypes[message.type].padEnd(messagesTypesMaxLength, ' ');
    return format('%s - %s - %s\n', formattedDate, formattedMessageType, message.text);
}
