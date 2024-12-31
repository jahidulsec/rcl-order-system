// src/api/getRetailers/retailers.ts
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Import the database connection
import { RowDataPacket } from 'mysql2';

// Define a type for the retailer rows
interface RetailerData extends RowDataPacket {
    id: number;
    retailer_name: string;
    sr_id: string;
    route_id: string;
    name_bn: string;
    proprietor_name: string;
    mobile_number: string;
    address: string;
    outlet_category: string;
    latitude: string;
    longitude: string;
    image: string;
}

export async function GET(req: Request) {
    try {
        // Get query parameters from the request
        const url = new URL(req.url);
        const routeId = url.searchParams.get('route_id');
        const userId = url.searchParams.get('user_id');

        if (!routeId) {
            return NextResponse.json({ error: 'Missing route_id parameter' }, { status: 400 });
        }

        // Get the database connection
        const connection = await getDbConnection();

        // Execute query to fetch retailer data
        const [rows] = await connection.execute<RetailerData[]>(
            `
            SELECT rl.* 
            FROM rcl_sr_assign_in_route ssin 
            INNER JOIN rcl_retailer_list rl ON ssin.sr_code = rl.sr_id 
            AND ssin.route_id = rl.route_id
            LEFT JOIN rcl_order o ON rl.id = o.retailer_id 
            AND DATE_FORMAT(o.order_date, '%Y-%m-%d') = DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d')
            WHERE ssin.sr_code = ? 
            AND ssin.route_id = ?  
            AND o.retailer_id IS NULL 
            GROUP BY rl.id 
            LIMIT 0, 500
        `,
            [userId, routeId]
        );
        // Return the rows as JSON
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch retailer data' },
            { status: 500 }
        );
    }
}
