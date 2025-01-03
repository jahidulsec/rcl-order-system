// src/app/route-list/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Route {
    id: number;
    route_name: string;
}

export default function RouteListPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState<Route[]>([]);
    const router = useRouter();

    // Fetch routes
    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        setUserId(storedUserId);

        const fetchRoutes = async (storedUserId: string | null) => {
            const res = await fetch('/api/getRoutes?user_id='+storedUserId);
            const data = await res.json();
            setRoutes(data);
        };
        fetchRoutes(storedUserId);
    }, []);

    // // Filtered routes
    // const filteredRoutes = routes.filter((route) =>
    //     route.route_name.toLowerCase().includes(searchTerm.toLowerCase())
    // );
    // Handle Search
    useEffect(() => {
        const filtered = routes.filter((route) =>
            route.route_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(filtered);
    }, [searchTerm, routes]);

    const handleRouteSelect = (routeName: string, routeId: number) => {
        // Remove selected retailer in localStorage
        localStorage.removeItem('selectedRetailerName');
        localStorage.removeItem('selectedRetailerId');

        // Store selected route in localStorage
        localStorage.setItem('selectedRouteName', routeName);
        localStorage.setItem('selectedRouteId', String(routeId));

        // Navigate back to the home page
        router.push(`/?user_id=${userId}`);
    };

    return (
        <div className="p-6 bg-gray-50 rounded-lg shadow-md max-w-md mx-auto">
            {/* Back Button */}
            <button
                onClick={() => {router.push(`/?user_id=${userId}`);}}
                className="absolute top-4 left-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
                <span className="text-lg">🔙</span>
            </button>

            {/* Title */}
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
                Select a Route
            </h1>

            {/* Search Bar */}
            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder="Search Routes"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Search Icon */}
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
        </span>
            </div>

            {/* Route List */}
            <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow-md overflow-hidden">
                {filteredData.length > 0 ? (
                    filteredData.map((route) => (
                        <li
                            key={route.id}
                            className="p-4 hover:bg-blue-100 transition-all duration-200 cursor-pointer flex items-center gap-2"
                            onClick={() => handleRouteSelect(route.route_name, route.id)}
                        >
                            {/* Route Icon */}
                            <span className="text-blue-500 text-lg">📍</span>
                            {/* Route Name */}
                            <span className="text-gray-700 font-medium">
                                {route.route_name}
                            </span>
                        </li>
                    ))
                ) : (
                    <p className="p-4 text-gray-500 text-center">
                        No route found.
                    </p>
                )}
            </ul>
        </div>
    );
}
