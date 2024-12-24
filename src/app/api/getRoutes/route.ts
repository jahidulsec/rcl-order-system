// src/api/getRoutes/route.ts
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Import the database connection
import { RowDataPacket } from 'mysql2';

// Define a type for the database rows
interface RouteData extends RowDataPacket {
    id: number;
    route_name: string;
    day: string;
}

export async function GET() {
    try {
        // Get the global database connection
        const connection = await getDbConnection();

        // Execute query and cast result to the correct type
        const [rows] = await connection.execute<RouteData[]>(
            `
            SELECT rl.id, rl.route_name, ar.day 
            FROM rcl_sr_assign_in_route ar
            INNER JOIN rcl_route_list rl ON ar.route_id = rl.id
            WHERE ar.sr_code = '30124'
        `
        );

        // Return the rows as JSON
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}
