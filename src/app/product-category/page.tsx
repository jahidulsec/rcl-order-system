// src/app/product-category/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductCategory {
    id: number;
    category_name: string;
}

export default function RouteListPage() {
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [searchCategory, setSearchCategory] = useState('');
    const router = useRouter();

    // Fetch routes
    useEffect(() => {
        const fetchProductCategories = async () => {
            const res = await fetch('/api/getProductCategory');
            const data = await res.json();
            setProductCategories(data);
        };
        fetchProductCategories();
    }, []);

    // Filtered routes
    const filteredProductCategories = productCategories.filter((productCategory) =>
        productCategory.category_name.toLowerCase().includes(searchCategory.toLowerCase())
    );

    const handleProductCategorySelect = (categoryName: string, categoryId: number) => {
        // Store selected Product Category in localStorage
        localStorage.setItem('selectedCategoryName', categoryName);
        localStorage.setItem('selectedCategoryId', String(categoryId));

        localStorage.removeItem('selectedProductName');
        localStorage.removeItem('selectedProductId');

        // Navigate back to the home page
        router.push('/');
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Select a Product Category</h1>

            {/* Search Bar */}
            <input
                type="text"
                placeholder="Search Routes"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full p-2 border rounded mb-4"
            />

            {/* Route List */}
            <ul>
                {filteredProductCategories.map((productCategory) => (
                    <li
                        key={productCategory.id}
                        className="p-3 border-b hover:bg-gray-200 cursor-pointer"
                        onClick={() => handleProductCategorySelect(productCategory.category_name, productCategory.id)}
                    >
                        {productCategory.category_name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
