"use strict";
/**
 * .form Cognitive Platform Parser
 * Main entry point for the .form file parser and compiler
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormPlatform = exports.FormCompiler = exports.FormSchema = exports.FormValidator = void 0;
// Core types
__exportStar(require("./types/FormTypes"), exports);
// Validation
var FormValidator_1 = require("./validation/FormValidator");
Object.defineProperty(exports, "FormValidator", { enumerable: true, get: function () { return FormValidator_1.FormValidator; } });
var FormSchema_1 = require("./validation/FormSchema");
Object.defineProperty(exports, "FormSchema", { enumerable: true, get: function () { return FormSchema_1.FormSchema; } });
// Compilation
var FormCompiler_1 = require("./compiler/FormCompiler");
Object.defineProperty(exports, "FormCompiler", { enumerable: true, get: function () { return FormCompiler_1.FormCompiler; } });
// Main API class
var FormPlatform_1 = require("./FormPlatform");
Object.defineProperty(exports, "FormPlatform", { enumerable: true, get: function () { return FormPlatform_1.FormPlatform; } });
//# sourceMappingURL=index.js.map