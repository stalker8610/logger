const fs = require('fs');
const util = require('util');

class Logger {

    constructor(basicPath, maxLogSize = 0) {
        this.basicPath = basicPath;
        this.path = basicPath;
        this.maxLogSize = maxLogSize;
    }

    log(data) {

        const openNewWriteStream = () => {
            this.path = this.basicPath.replace(/\.log/, '') + new Date().toISOString().replace(/-|T|:/g, '').replace(/\..+/, '') + '.log';
            this.writeStream = fs.createWriteStream(this.path, { flags: 'w'});
        }

        const formatDate = (date) => {
            let s = date.toISOString().replace(/T/, ' ')
            return s.substring(0, s.length - 5);
        }

        if (!this.writeStream || this.writeStream.closed) {
            openNewWriteStream();
        } else if (this.maxLogSize) {
            try {
                if (fs.statSync(this.path).size > this.maxLogSize)
                    openNewWriteStream();
            }
            catch (err) {
                //it's OK if ENOENT 
            }
        }

        this.writeStream.write(util.format('%s - %s\n', formatDate(new Date()), data));

    }

    close() {
        if (this.writeStream && !this.writeStream.closed) {
            this.writeStream.close();
        }
    }

}

module.exports = Logger;
