import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Import the database connection
import { RowDataPacket } from 'mysql2';

// Define a type for the database rows
interface ProductData extends RowDataPacket {
    id: number;
    category_id: number;
    brand_name: string;
    sub_brand_name: string;
    product_name: string;
    price: number;
    discount_percentage: number;
    stock: number;
    sku: string;
    ctn_factor: number;
    product_status: string;
    quantity_for_sample: number;
    sample_quantity: number;
    sample_product_code: string;
    is_sample: number;
    status: number;
    ctn_discount_percentage: number;
    ctn_quantity_for_sample: number;
    ctn_sample_quantity: number;
    ctn_sample_product_code: string;
    discount_amount: number;
    mrp: number;
    display_sample_for_qty: number;
    display_sample_qty: number;
}

export async function GET(req: Request) {
    try {
        // Get query parameters from the request
        const url = new URL(req.url);
        const categoryId = url.searchParams.get('category_id');

        if (!categoryId) {
            return NextResponse.json({ error: 'Missing category id parameter' }, { status: 400 });
        }

        // Get the global database connection
        const connection = await getDbConnection();

        // Execute the query and cast result to the correct type
        // const [rows] = await connection.execute<ProductData[]>(
        //     `
        //     SELECT pl.*
        //     FROM rcl_product_list pl
        //     INNER JOIN rcl_product_category pc ON pl.category_id = pc.id
        //     WHERE pl.category_id = ? AND pl.is_sample = 0 AND pl.status = 1;
        // `,[categoryId]
        // );

        const [rows] = await connection.execute<ProductData[]>(
            `
            SELECT pl.* 
            FROM rcl_product_list pl 
            WHERE pl.is_sample = 0 AND pl.status = 1;
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
