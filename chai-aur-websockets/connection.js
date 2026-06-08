import {Redis} from 'ioredis';

const redisPublish = new Redis({ host: "localhost", port: 6379 });

const redisSubscribe = new Redis({ host: "localhost", port: 6379 });

export {redisPublish, redisSubscribe};