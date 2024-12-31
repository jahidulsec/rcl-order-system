import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Import the database connection
import { RowDataPacket } from 'mysql2';

// Define a type for the database rows
interface DistributorStockData extends RowDataPacket {
    id: number;
    distributor_id: number;
    product_id: number;
    stock: number;
    stock_per_pis: number;
    pis: number;
}

export async function GET(req: Request) {
    try {
        // Get query parameters from the request
        const url = new URL(req.url);
        const productId = url.searchParams.get('product_id');
        const userId = url.searchParams.get('user_id');

        if (!productId) {
            return NextResponse.json({ error: 'Missing product id parameter' }, { status: 400 });
        }

        // Get the global database connection
        const connection = await getDbConnection();

        // Execute the query and cast result to the correct type
        const [rows] = await connection.execute<DistributorStockData[]>(
            `
            SELECT ds.id,ds.distributor_id,ds.product_id,ds.stock,ds.stock_per_pis,
            COALESCE((
                SELECT SUM(ol.qty) pis 
                FROM rcl_order ol 
                INNER JOIN rcl_order o ON ol.order_id=o.id 
                WHERE o.status = 1 AND ol.product_id= ? 
                AND o.user_id IN (
                    SELECT sr_id FROM rcl_distributor_territory 
                    WHERE distributor_id = (
                        SELECT distributor_id FROM rcl_distributor_territory WHERE sr_id = '${userId}')) 
                        GROUP BY ol.product_id LIMIT 1),0) pis FROM rcl_distributor_stock ds 
            WHERE ds.product_id = ? 
            AND ds.distributor_id = (SELECT distributor_id FROM rcl_distributor_territory WHERE sr_id = '${userId}' LIMIT 1);
        `,[productId, productId]
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
