'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Retailer {
    id: number;
    retailer_name: string;
    name_bn: string;
    proprietor_name: string;
    mobile_number: string;
    address: string;
    outlet_category: string;
}

export default function RetailerListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const routeId = searchParams.get('route_id');
    const userId = localStorage.getItem("userId");

    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [filteredRetailers, setFilteredRetailers] = useState<Retailer[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (routeId) {
            setIsLoading(true);
            fetch(`/api/getRetailers?route_id=${routeId}&user_id=${userId}`)
                .then((res) => res.json())
                .then((data) => {
                    setRetailers(data);
                    setFilteredRetailers(data); // Initialize filtered list
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching retailers:', error);
                    setIsLoading(false);
                });
        }
    }, [routeId]);

    // Handle Search
    useEffect(() => {
        const filtered = retailers.filter((retailer) =>
            retailer.retailer_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredRetailers(filtered);
    }, [searchTerm, retailers]);

    const handleRetailerClick = (retailer: Retailer) => {
        localStorage.setItem('selectedRetailerName', retailer.retailer_name);
        localStorage.setItem('selectedRetailerId', String(retailer.id));
        router.push(`/?user_id=${userId}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            {/* Back Button */}
            <button
                onClick={() => {router.push(`/?user_id=${userId}`);}}
                className="absolute top-4 left-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
                <span className="text-lg">🔙</span>
            </button>

            {/* Title */}
            <h1 className="text-3xl font-extrabold mb-6 text-gray-800">Retailer List</h1>

            {/* Search Bar */}
            <div className="relative mb-6 w-full max-w-md">
                <input
                    type="text"
                    placeholder="Search Retailers"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                </span>
            </div>

            {/* Retailer List */}
            {isLoading ? (
                <div
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <ul className="w-full max-w-3xl bg-white rounded-lg shadow-md overflow-hidden divide-y divide-gray-200">
                    {filteredRetailers.length > 0 ? (
                        filteredRetailers.map((retailer) => (
                            <li
                                key={retailer.id}
                                className="p-4 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                                onClick={() => handleRetailerClick(retailer)}
                            >
                                <div className="flex flex-col sm:flex-row justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-gray-800">
                                            {retailer.retailer_name}
                                        </p>
                                        <p className="text-gray-600 text-sm">
                                            Proprietor: {retailer.proprietor_name}
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            {retailer.address} | {retailer.mobile_number}
                                        </p>
                                    </div>
                                    <div className="flex items-center mt-2 sm:mt-0">
                                        <span className="inline-block bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">
                                            {retailer.outlet_category}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <p className="p-4 text-gray-500 text-center">
                            No retailers found for this route.
                        </p>
                    )}
                </ul>
            )}
        </div>
    );
}
