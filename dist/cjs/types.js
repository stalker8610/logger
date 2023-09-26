"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesTypes = exports.LoggingModes = void 0;
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
})(MessagesTypes || (exports.MessagesTypes = MessagesTypes = {}));
