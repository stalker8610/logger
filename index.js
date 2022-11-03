const fs = require('fs');
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

class Logger {

    constructor(basicPath, mode = loggingModes.STANDARD_MODE, maxLogSize = 0) {
        this.basicPath = basicPath;
        this.path = basicPath;
        this.maxLogSize = maxLogSize;
        this.mode = mode;
        this.messages = [];
        this.pending = false;

        this.timer = setInterval(() => {
            this.writeDataToFileAsync()
        }, 1000);
    }

    async writeDataToFileAsync() {

        if (this.pending) return;

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

        this.pending = true;

        while (this.messages.length) {

            const data = this.messages.shift();

            if (!this.writeStream || this.writeStream.closed) {
                await openNewWriteStream();
            }

            await writeAsync(data);

        }

        this.pending = false;

        if (this.closeStreamAfterWriting) {
            this.close();
        }
    }

    log(data, messageType = messagesTypes.INFO) {

        if (messageType >= this.mode)
            this.messages.push({
                message: data,
                timeStamp: new Date()
            });

    }

    close() {

        if (this.pending || this.messages.length) {
            this.closeStreamAfterWriting = true;
            return;
        }
        else {

            clearInterval(this.timer);

            if (this.writeStream && !this.writeStream.closed) {
                this.writeStream.close();
            }
        }
    }

}

module.exports = { Logger, messagesTypes, loggingModes };
