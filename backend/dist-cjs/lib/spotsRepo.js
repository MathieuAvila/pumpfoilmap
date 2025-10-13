"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSpots = listSpots;
exports.createSpot = createSpot;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const USE_INMEMORY = process.env.USE_INMEMORY === 'true' || process.env.IS_OFFLINE === 'true';
let memory = null;
function loadSeeds() {
    const seedsPath = node_path_1.default.join(process.cwd(), 'seeds', 'spots.json');
    try {
        const raw = node_fs_1.default.readFileSync(seedsPath, 'utf-8');
        const data = JSON.parse(raw);
        return data;
    }
    catch {
        return [];
    }
}
async function listFromMemory(limit) {
    if (!memory)
        memory = loadSeeds();
    return memory.slice(0, limit);
}
async function createInMemory(spot) {
    if (!memory)
        memory = loadSeeds();
    memory.unshift(spot);
}
async function listSpots(limit) {
    if (USE_INMEMORY)
        return listFromMemory(limit);
    const [{ ddb, TABLE_SPOTS }, { ScanCommand }] = await Promise.all([
        Promise.resolve().then(() => __importStar(require('./db'))),
        Promise.resolve().then(() => __importStar(require('@aws-sdk/lib-dynamodb')))
    ]);
    const res = await ddb.send(new ScanCommand({ TableName: TABLE_SPOTS, Limit: limit }));
    return (res.Items ?? []);
}
async function createSpot(spot) {
    if (USE_INMEMORY)
        return createInMemory(spot);
    const [{ ddb, TABLE_SPOTS }, { PutCommand }] = await Promise.all([
        Promise.resolve().then(() => __importStar(require('./db'))),
        Promise.resolve().then(() => __importStar(require('@aws-sdk/lib-dynamodb')))
    ]);
    await ddb.send(new PutCommand({
        TableName: TABLE_SPOTS,
        Item: spot,
        ConditionExpression: 'attribute_not_exists(spotId)'
    }));
}
