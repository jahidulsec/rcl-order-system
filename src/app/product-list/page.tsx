'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {RowDataPacket} from "mysql2";

interface Product {
    id: number;
    category_id: number;
    product_name: string;
    price: number;
    discount_percentage: number;
    discount_amount: number;
    sku: string;
    ctn_factor: number;
    quantity_for_sample: number;
    sample_quantity: number;
    sample_product_code: string;
    display_sample_for_qty: number;
    display_sample_qty: number;
    is_sample: number;
}

interface DistributorStock {
    stock: number;
    stock_per_pis: number;
}

interface OffersData extends RowDataPacket {
    id: number;
    product_id: string;
    product_name: string;
    qty: number;
    discount_amount: number;
    sample_id: string;
    sample_product_name: string;
    sample_qty: number;
    gift_item_code: string;
    gift_product_name: string;
    gift_item_qty: number;
    additional_discount_amount: number;
}

export default function ProductListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('category_id');

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [stockData, setStockData] = useState<DistributorStock | null>(null);
    const [quantity, setQuantity] = useState<number>(1);

    useEffect(() => {
        if (categoryId) {
            setIsLoading(true);
            fetch(`/api/getProductList?category_id=${categoryId}`)
                .then((res) => res.json())
                .then((data) => {
                    setProducts(data);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching products:', error);
                    setIsLoading(false);
                });
        }
    }, [categoryId]);

    // Update filtered products when searchTerm changes
    useEffect(() => {
        const filtered = products.filter((product) =>
            product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toString().includes(searchTerm)
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const getOffersFromAPI = async (productId: number | undefined): Promise<OffersData[]> => {
        try {
            const res = await fetch(`/api/getOffer?product_id=${productId}`);
            const data: OffersData[] = await res.json();

            if (data && data.length > 0) {
                return data; // Return the first matching offer
            } else {
                return []; // No offer available
            }
        } catch (error) {
            console.error('Error fetching offer:', error);
            return []; // Return [] on error
        }
    };

    const getOffer = async (quantity: number) => {
        const offers = await getOffersFromAPI(selectedProduct?.id);
        if (offers) {
            // Sort offers in descending order of qty
            const sortedOffers = offers.sort((a, b) => b.qty - a.qty);

            // Find the best applicable offer
            const applicableOffer = sortedOffers.find((offer) => quantity >= offer.qty);

            if (applicableOffer) {
                const offerDetails = {
                    product_id: Number(applicableOffer.product_id) || null,
                    discount_amount: Number(applicableOffer.discount_amount) || 0,
                    sample_id: applicableOffer.sample_id || null,
                    sample_product_name: applicableOffer.sample_product_name || null,
                    sample_qty: Number(applicableOffer.sample_qty) || 0,
                    gift_item_code: applicableOffer.gift_item_code || null,
                    gift_product_name: applicableOffer.gift_product_name || null,
                    gift_item_qty: Number(applicableOffer.gift_item_qty) || 0,
                    additional_discount_amount: Number(applicableOffer.additional_discount_amount) || 0,
                };
                console.log("Applicable Offer Details:", offerDetails);
                return offerDetails;
            } else {
                console.log("No offer available for this quantity.");
                return null;
            }
        } else {
            console.log("No offer available for this product.");
            return null;
        }
    };

    const handleProductClick = (product: Product) => {
        const storedProductList = JSON.parse(localStorage.getItem('selectedProductList') || '[]');
        // Check if product already exists
        const isProductExist = storedProductList.some(
            (ex_product: { id: number; }) => ex_product.id === product.id
        );
        if (!isProductExist) {
            // Fetch distributor stock for the selected product
            fetch(`/api/getDistributorStock?product_id=${product.id}`)
                .then((res) => res.json())
                .then((data) => {
                    setStockData(data[0]);
                    setSelectedProduct(product);
                    setIsModalOpen(true);
                })
                .catch((error) => {
                    console.error('Error fetching stock:', error);
                });
        }else{
            alert('This product is already in the cart!');
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(1, Number(e.target.value)); // Ensure quantity is at least 1
        setQuantity(value);
    };

    const handleAddToCart = async () => {
        if (selectedProduct && stockData) {

            const offerDetails = await getOffer(quantity);

            // Store product information in localStorage or handle it as needed
            localStorage.setItem('selectedProductName', selectedProduct.product_name);
            localStorage.setItem('selectedProductId', String(selectedProduct.id));

            // Create a new product entry with quantity
            const newProduct = {
                product_name: selectedProduct.product_name,
                ctn_factor: selectedProduct.ctn_factor,
                id: selectedProduct.id,
                price: selectedProduct.price,
                quantity,
                offer: offerDetails,
            };

            // Retrieve existing products from localStorage
            const storedProductList = JSON.parse(localStorage.getItem('selectedProductList') || '[]');

            // Check if product already exists
            const isProductExist = storedProductList.some(
                (product: { id: number; }) => product.id === newProduct.id
            );

            if (!isProductExist) {
                const inputQuantity = Number(quantity);

                // Check if updatedQty exceeds available stock
                if (stockData && inputQuantity > stockData.stock) {
                    alert(`Cannot update quantity. Available stock is only ${stockData.stock}.`);
                } else {
                    // Add the new product at the beginning of the list
                    const updatedProductList = [newProduct, ...storedProductList];

                    // Save the updated list to localStorage
                    localStorage.setItem('selectedProductList', JSON.stringify(updatedProductList));

                    // Close modal and navigate to home page
                    setIsModalOpen(false);
                    router.push('/');
                }
            } else {
                // Optionally display a warning or alert if the product exists
                alert('This product is already in the cart!');
            }
        }
    };

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">

            {/* Back Button */}
            <button
                onClick={() => {router.push('/');}}
                className="absolute top-4 left-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
                <span className="text-lg">🔙</span>
            </button>

            {/* Page Title */}
            <h1 className="text-3xl font-extrabold mb-6 text-gray-800 tracking-wider">Product List</h1>

            {/* Search Bar */}
            <div className="relative mb-6 w-full max-w-md">
                <input
                    type="text"
                    placeholder="Search by Product ID or Name"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full p-3 pl-10 border rounded-full shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center">
                    <div
                        className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="ml-4 text-gray-500 text-lg font-semibold">Loading Products...</p>
                </div>
            ) : (
                /* Product List */
                <ul className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <li
                                key={product.id}
                                className="p-4 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                                onClick={() => handleProductClick(product)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xl font-bold text-gray-800">{product.product_name}</p>
                                        <p className="text-gray-500 text-sm">ID: {product.id} | SKU: {product.sku}</p>
                                        <p className="text-green-600 font-semibold mt-1">৳{product.price}</p>
                                    </div>
                                    <div>
                                <span
                                    className="inline-block bg-blue-100 text-blue-600 px-3 py-1 text-xs font-medium rounded-full">
                                    Available
                                </span>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <p className="p-4 text-center text-gray-500 font-medium">
                            No products found for this category.
                        </p>
                    )}
                </ul>
            )}

            {/* Modal for Quantity Input */}
            {isModalOpen && selectedProduct && stockData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full">
                        {/* Modal Title */}
                        <h2 className="text-xl font-bold mb-2 text-center text-gray-800">
                            Enter Quantity for <span className="text-blue-500">{selectedProduct.product_name}</span>
                        </h2>

                        {/* Stock Information */}
                        <div className="mb-2">
                            <p className="text-gray-700">
                                <strong>Available Stock:</strong> {stockData.stock}
                            </p>
                            <p className="text-gray-700">
                                <strong>Stock per Unit:</strong> {stockData.stock_per_pis}
                            </p>
                        </div>

                        {/* Quantity Input */}
                        <div className="mb-2">
                            <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                max={stockData.stock}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-between">
                            <button
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                                onClick={handleAddToCart}
                            >
                                Add to Cart
                            </button>
                            <button
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}
