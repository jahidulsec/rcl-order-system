// src/app/api/saveVisit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Replace with your DB connection logic
import { format } from 'date-fns';

interface SaveOrderRequest {
    userId: string;
    retailerId: string;
    visitType: string;
    latitude?: string;
    longitude?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        console.log('Request Body:', body);
        const { userId, retailerId, visitType, latitude, longitude }: SaveOrderRequest = body;

        // Validate required fields
        if (!userId || !retailerId || !visitType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Prepare data
        const orderDate = format(new Date(), 'yyyy-MM-dd');
        const deviceType = 'WebApplication';

        const query = `
            INSERT INTO rcl_order (
                user_id, retailer_id, order_date, device_type, status, draft, visit_type, latitude, longitude, geo_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            userId,
            retailerId,
            orderDate,
            deviceType,
            1,
            0,
            visitType,
            latitude || null,
            longitude || null,
            latitude && longitude ? 1 : 0,
        ];

        // Get the database connection
        const connection = await getDbConnection();

        // Execute the query
        const [result] = await connection.execute(query, values);

        // Return success response
        return NextResponse.json({
            message: 'Visit saved successfully',
            result: result
        });
    } catch (error) {
        console.error('Error saving order:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
