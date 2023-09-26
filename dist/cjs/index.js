"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs = require("fs");
const util_1 = require("util");
const types_js_1 = require("./types.js");
function maxKeyLengthOf(o) {
    let keys = Object.keys(o);
    return keys.reduce((maxLength, cur) => cur.length > maxLength ? cur.length : maxLength, 0);
}
const messagesTypesMaxLength = maxKeyLengthOf(types_js_1.MessagesTypes);
const timezoneOffsetSeconds = new Date().getTimezoneOffset() * 60;
class Logger {
    constructor(basicPath, mode = types_js_1.LoggingModes.STANDARD_MODE, maxLogSize = 0, verbose = false) {
        this.basicPath = basicPath;
        this.mode = mode;
        this.maxLogSize = maxLogSize;
        this.verbose = verbose;
        this.writeStream = null;
    }
    setMode(mode) {
        this.mode = mode;
    }
    log(text, type = types_js_1.MessagesTypes.INFO, sync = false) {
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
        this.log(message, types_js_1.MessagesTypes.INFO, sync);
    }
    warn(message, sync = false) {
        this.log(message, types_js_1.MessagesTypes.WARN, sync);
    }
    error(message, sync = false) {
        this.log(message, types_js_1.MessagesTypes.ERROR, sync);
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
    const formattedMessageType = types_js_1.MessagesTypes[message.type].padEnd(messagesTypesMaxLength, ' ');
    return (0, util_1.format)('%s - %s - %s', formattedDate, formattedMessageType, message.text);
}
