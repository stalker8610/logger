"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LoggingModes = void 0;
const fs = require("fs");
const util_1 = require("util");
var LoggingModes;
(function (LoggingModes) {
    LoggingModes[LoggingModes["DEBUG_MODE"] = 0] = "DEBUG_MODE";
    LoggingModes[LoggingModes["STANDARD_MODE"] = 1] = "STANDARD_MODE";
})(LoggingModes || (exports.LoggingModes = LoggingModes = {}));
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
class Logger {
    constructor(basicPath, mode = LoggingModes.STANDARD_MODE, maxLogSize = 0, verbose = false) {
        this.basicPath = basicPath;
        this.mode = mode;
        this.maxLogSize = maxLogSize;
        this.verbose = verbose;
        this.writeStream = null;
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
    close() {
        if (this.writeStream && !this.writeStream.closed) {
            this.writeStream.close();
        }
    }
    isMessageApproachesTheMode(messageType) {
        return (messageType >= this.mode);
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
        const writeAndCheckLength = (text) => {
            this.writeStream.write(text + '\n', () => {
                if (this.maxLogSize && fs.statSync(this.writeStream.path).size >= this.maxLogSize) {
                    this.writeStream.close();
                }
            });
        };
        if (!this.writeStream || this.writeStream.closed) {
            const dirPath = this.basicPath.substring(0, this.basicPath.lastIndexOf('\\'));
            const formattedTimestamp = applyTimeZone(new Date()).toISOString().replace(/-|T|:/g, '').replace(/\..+/, '');
            const filePath = this.basicPath.replace(/\.log/, '') + formattedTimestamp + '.log';
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            this.writeStream = fs.createWriteStream(filePath, { flags: 'w', autoClose: false });
        }
        const formattedMessage = formatMessage(message);
        if (this.writeStream.pending) {
            this.writeStream.once('ready', () => {
                writeAndCheckLength(formattedMessage);
            });
        }
        else {
            writeAndCheckLength(formattedMessage);
        }
    }
}
exports.Logger = Logger;
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
    return (0, util_1.format)('%s - %s - %s', formattedDate, formattedMessageType, message.text);
}
