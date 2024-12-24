// src/api/getProductCategory/route.ts
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Import the database connection
import { RowDataPacket } from 'mysql2';

// Define a type for the database rows
interface ProductCategoryData extends RowDataPacket {
    id: number;
    category_name: string;
}

export async function GET() {
    try {
        // Get the global database connection
        const connection = await getDbConnection();

        // Execute query and cast result to the correct type
        const [rows] = await connection.execute<ProductCategoryData[]>(
            `SELECT * FROM rcl_product_category WHERE status = 1 ORDER BY category_name`
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
