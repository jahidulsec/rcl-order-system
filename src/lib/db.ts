// src/lib/db.ts
import mysql, { Connection } from 'mysql2/promise';

let connection: Connection | null = null;

const dbConfig = {
    host: '209.97.172.21',
    user: 'root',
    password: 'rcl@123',
    database: 'rcldb_demo',
};

export const getDbConnection = async () => {
    if (connection) {
        return connection;
    }

    try {
        connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw new Error('Failed to connect to the database');
    }
};
