import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Import the database connection
import { RowDataPacket } from 'mysql2';

// Define a type for the database rows
interface OfferData extends RowDataPacket {
    id: number;
    product_id: number;
    product_name: string;
    qty: number;
    discount_amount: number;
    sample_id: number;
    sample_product_name: string;
    sample_qty: number;
    gift_item_code: number;
    gift_product_name: string;
    gift_item_qty: number;
    additional_discount_amount: number;
}

export async function GET(req: Request) {
  try {
    // Get query parameters from the request
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'Missing product id parameter' }, { status: 400 });
    }

    // Get the global database connection
    const connection = await getDbConnection();

    // Execute the query and cast result to the correct type
    const [rows] = await connection.execute<OfferData[]>(
      `
            SELECT o.id,
                o.product_id, pl_o.product_name, o.qty, o.discount_amount, 
                o.sample_id, pl_s.product_name sample_product_name, o.sample_qty, 
                o.gift_item_code, pl_g.product_name gift_product_name, o.gift_item_qty,
                o.additional_discount_amount
                FROM rcl_offers o 
                INNER JOIN rcl_product_list pl_o ON o.product_id=pl_o.id
                LEFT JOIN rcl_product_list pl_s ON o.sample_id=pl_s.id
                LEFT JOIN rcl_product_list pl_g ON o.gift_item_code=pl_g.id WHERE o.product_id=? AND o.status=1;
        `,[productId]
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
