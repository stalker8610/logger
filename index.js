const fs = require('fs');
const { EventEmitter } = require('stream');
const util = require('util');

const loggingModes = {
    DEBUG_MODE: 0,
    STANDARD_MODE: 1
}

const messagesTypes = {
    INFO: 0,
    IMPORTANT: 1,
    ERROR: 2
}

class Logger extends EventEmitter {

    constructor(basicPath, mode = loggingModes.STANDARD_MODE, maxLogSize = 0) {
        super();
        this.basicPath = basicPath;
        this.path = basicPath;
        this.maxLogSize = maxLogSize;
        this.mode = mode;
        this.messages = [];
        this.pending = false;
        this.timer = setInterval(() => {
            this._writeDataToFileAsync()
        }, 1000);
    }

    //public methods
    setMode(mode) {
        this.mode = mode;
    }

    log(data, messageType = messagesTypes.INFO) {

        const isMessageApproachesTheMode = (messageType) => {
            return (messageType >= this.mode)
        }

        if (isMessageApproachesTheMode(messageType))
            this.messages.push({
                message: data,
                timeStamp: new Date()
            });

    }

    async close() {

        if (this.pending) {
            await this._waitForWritingDone();
        }
        else if (this.messages.length) {
            await this._writeDataToFileAsync();
        }

        clearInterval(this.timer);

        if (this.writeStream && !this.writeStream.closed) {
            this.writeStream.close();
        }

    }

    //private service methods
    async _writeDataToFileAsync() {

        this.pending = true;
        clearInterval(this.timer);

        const openNewWriteStream = () => {
            return new Promise((resolve) => {
                this.path = this.basicPath.replace(/\.log/, '') + new Date().toISOString().replace(/-|T|:/g, '').replace(/\..+/, '') + '.log';
                this.writeStream = fs.createWriteStream(this.path, { flags: 'w' });
                this.writeStream.on('ready', () => {
                    resolve();
                })
            })
        }

        const formatDate = (date) => {
            let s = date.toISOString().replace(/T/, ' ')
            return s.substring(0, s.length - 5);
        }


        const writeAsync = (data) => {
            return new Promise((resolve) => {
                this.writeStream.write(util.format('%s - %s\n', formatDate(data.timeStamp), data.message), () => {
                    if (this.maxLogSize && fs.statSync(this.path).size >= this.maxLogSize) {
                        this.writeStream.close(() => {
                            resolve();
                        });
                    } else resolve();
                });

            })
        }

        while (this.messages.length) {

            const data = this.messages.shift();

            if (!this.writeStream || this.writeStream.closed) {
                await openNewWriteStream();
            }

            await writeAsync(data);

        }

        this.timer = setInterval(() => {
            this._writeDataToFileAsync()
        }, 1000);

        this.pending = false;
        this.emit('writing done')

    }

    async _waitForWritingDone() {

        return new Promise((resolve) => {
            this.once('writing done', () => {
                resolve();
            })
        })
    }

}

module.exports = { Logger, messagesTypes, loggingModes };
