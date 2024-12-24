// [
//     {
//         "product_name": "Sheuly Sanitary Napkin- Belt- 08 pads",
//         "id": 40187,
//         "price": "51.00",
//         "quantity": 42,
//         "offer": {
//             "product_id": 40187,
//             "discount_amount": 72,
//             "sample_id": 40017,
//             "sample_product_name": "Raxoll Moisturizing Hand Wash-170ml-Refill",
//             "sample_qty": 7,
//             "gift_item_code": "90000005",
//             "gift_product_name": "Gift of  Raxoll Soap - Active 100gm",
//             "gift_item_qty": 1,
//             "additional_discount_amount": 100
//         }
//     },
//     {
//         "product_name": "Snapkin Sanitary Napkin- RF- 10 pads",
//         "id": 40049,
//         "price": "95.00",
//         "quantity": 1,
//         "offer": null
//     },
//     {
//         "product_name": "Kinder Wet Wipes- 120 pcs Pouch",
//         "id": 40023,
//         "price": "170.00",
//         "quantity": 1,
//         "offer": null
//     }
// ]

// src/app/api/saveOrder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import {format} from "date-fns";
import { ResultSetHeader, FieldPacket } from 'mysql2/promise';

interface OrderList {
    order_id: number;
    product_id: number;
    price: number;
    qty: number;
    org_total: number;
    total: number;
    ctn_factor: number;
    discount_amount: number;
    s_discount_amount:  number;
    additional_discount_amount:  number;
    product_status: string,
    is_sample_available: number,
    is_sample: number,
    sample_qty: number,
    for_which_product_code: number,
    sample_product_code: number,
    is_gift: number,
    gift_item_code: number,
    gift_item_qty: number,
}

export async function POST(request: NextRequest) {
    const connection = await getDbConnection();
    try {
        const body = await request.json();

        const { orderData, orderListData } = body;

        // Validate required fields
        if (!orderData || !orderListData || !orderListData.length) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Begin transaction
        await connection.beginTransaction();

        // Prepare data
        const orderDate = format(new Date(), 'yyyy-MM-dd');
        const deviceType = 'WebApplicationTEST';

        const orderQuery = `
            INSERT INTO rcl_order_test (
                user_id, retailer_id, order_date, device_type, status, draft, visit_type, latitude, longitude, geo_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const orderValues = [
            orderData.userId,
            orderData.retailerId,
            orderDate,
            deviceType,
            1,
            0,
            'Order',
            orderData.latitude || null,
            orderData.longitude || null,
            orderData.latitude && orderData.longitude ? 1 : 0,
        ];

        const [orderResult]: [ResultSetHeader, FieldPacket[]] = await connection.execute(orderQuery, orderValues);
        const orderId = (orderResult as ResultSetHeader).insertId;

        // Prepare data for `order_list`
        const orderListValues = orderListData.map((product: OrderList) => [
            orderId,
            product.product_id,
            product.price,
            product.qty,
            product.org_total,
            product.total,
            product.ctn_factor,
            product.discount_amount,
            product.s_discount_amount,
            product.additional_discount_amount,
            product.product_status,
            product.is_sample_available,
            product.is_sample,
            product.sample_qty,
            product.for_which_product_code || null,
            product.sample_product_code || null,
            product.is_gift,
            product.gift_item_code || null,
            product.gift_item_qty || null,
        ]);

        // Insert into `order_list` table
        const insertOrderListQuery = `
            INSERT INTO rcl_order_list_test (
                order_id, product_id, price, qty, org_total, total, ctn_factor, discount_amount, 
                s_discount_amount, additional_discount_amount, product_status, is_sample_available, 
                is_sample, sample_qty, for_which_product_code, sample_product_code, is_gift, gift_item_code, gift_item_qty
            ) VALUES ?
        `;
        await connection?.query(insertOrderListQuery, [orderListValues]);

        // Commit transaction
        await connection.commit();

        // Return success response
        return NextResponse.json({ message: 'Order and order list saved successfully!' });
    } catch (error) {
        // Rollback transaction in case of an error
        await connection.rollback();
        console.error('Error saving order and order list:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
