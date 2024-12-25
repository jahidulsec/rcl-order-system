"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { RowDataPacket } from "mysql2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUndo } from "@fortawesome/free-solid-svg-icons";

interface CartProduct {
  id: number;
  ctn_factor: number;
  product_name: string;
  price: string;
  quantity: string;
  offer?: OfferDetails | null;
}
interface OfferDetails {
  product_id: string;
  product_name: string;
  qty: number;
  discount_amount: number;
  sample_id?: string | null;
  sample_product_name?: string | null;
  sample_qty: number;
  gift_item_code?: string | null;
  gift_product_name?: string | null;
  gift_item_qty: number;
  additional_discount_amount: number;
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

interface OrderData {
  userId?: string | null;
  retailerId: string;
  visitType: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId: string | null = searchParams.get("user_id");
  const [selectedRoute, setSelectedRoute] = useState<{
    name: string;
    id: number;
  }>({ name: "Select Route", id: 0 });
  const [selectedRetailer, setSelectedRetailer] = useState<{
    retailer_name: string;
    id: number;
  }>({ retailer_name: "Select Retailer", id: 0 });
  const [selectedProductCategory, setSelectedProductCategory] = useState<{
    category_name: string;
    id: number;
  }>({ category_name: "Select Product Category", id: 0 });
  const [selectedProductList, setSelectedProductList] = useState<CartProduct[]>(
    []
  );
  const [isEditPopupOpen, setEditPopupOpen] = useState(false); // Modal State
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(
    null
  ); // Selected Product State
  const [updatedQty, setUpdatedQty] = useState(""); // Quantity Input State
  const [stockData, setStockData] = useState<DistributorStock | null>(null);
  const [totalQty, setTotalQty] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalAdditionalDiscountAmount, setTotalAdditionalDiscountAmount] =
    useState(0);
  const [selectedVisitType, setSelectedVisitType] = useState<string>("");
  const [showVisitPopup, setShowVisitPopup] = useState<boolean>(false);
  const visitType = [
    "Outlet closed",
    "Stock Available",
    "Shopkeeper Absent",
    "Fund Crisis",
    "Disagree",
  ];
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const currentDate = new Date().toLocaleDateString();

  useEffect(() => {
      if (userId) {
          localStorage.setItem("userId", userId);
      } else {
          alert("User ID is missing. Please check the URL parameters.");
      }

    // Check if geolocation is available
    if (navigator.geolocation) {
      // Get the current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success: Update the state with latitude and longitude
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          // Error: Handle geolocation failure (e.g., user denied access)
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    const routeName = localStorage.getItem("selectedRouteName");
    const routeId = localStorage.getItem("selectedRouteId");
    const retailerName = localStorage.getItem("selectedRetailerName");
    const retailerId = localStorage.getItem("selectedRetailerId");
    const categoryName = localStorage.getItem("selectedCategoryName");
    const categoryId = localStorage.getItem("selectedCategoryId");
    const productName = localStorage.getItem("selectedProductName");
    const productId = localStorage.getItem("selectedProductId");
    const selectedProductListIsAvailable = localStorage.getItem(
      "selectedProductList"
    );

    if (routeName && routeId)
      setSelectedRoute({ name: routeName, id: parseInt(routeId) });
    if (retailerName && retailerId)
      setSelectedRetailer({
        retailer_name: retailerName,
        id: parseInt(retailerId),
      });
    if (categoryName && categoryId)
      setSelectedProductCategory({
        category_name: categoryName,
        id: parseInt(categoryId),
      });
    if (productName && productId) {
      console.log("New Product added");
    }
    if (selectedProductListIsAvailable) {
      const storedProductList = JSON.parse(
        localStorage.getItem("selectedProductList") || "[]"
      );
      setSelectedProductList(storedProductList);
    }
  }, [searchParams]);

  const clearSelectedLocalStorage = () => {
    localStorage.removeItem("selectedRouteName");
    localStorage.removeItem("selectedRouteId");
    localStorage.removeItem("selectedRetailerName");
    localStorage.removeItem("selectedRetailerId");
    localStorage.removeItem("selectedCategoryName");
    localStorage.removeItem("selectedCategoryId");
    localStorage.removeItem("selectedProductName");
    localStorage.removeItem("selectedProductId");
    localStorage.removeItem("selectedProductList");
    console.log("Selected keys have been cleared.");
  };

  const handleProductClick = (product: CartProduct) => {
    // Fetch distributor stock for the selected product
    fetch(`/api/getDistributorStock?product_id=${product.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStockData(data[0]);
        openEditPopup(product);
      })
      .catch((error) => {
        console.error("Error fetching stock:", error);
      });
  };

  // Open the edit popup
  const openEditPopup = (product: CartProduct) => {
    setSelectedProduct(product);
    setUpdatedQty(product.quantity); // Set current quantity in input
    setEditPopupOpen(true);
  };

  // Close the popup
  const closeEditPopup = () => {
    setEditPopupOpen(false);
    setSelectedProduct(null);
  };

  const getOffersFromAPI = async (
    productId: number | undefined
  ): Promise<OffersData[]> => {
    try {
      const res = await fetch(`/api/getOffer?product_id=${productId}`);
      const data: OffersData[] = await res.json();

      if (data && data.length > 0) {
        return data; // Return the first matching offer
      } else {
        return []; // No offer available
      }
    } catch (error) {
      console.error("Error fetching offer:", error);
      return []; // Return [] on error
    }
  };

  const getOffer = async (quantity: number) => {
    const offers = await getOffersFromAPI(selectedProduct?.id);
    if (offers) {
      // Sort offers in descending order of qty
      const sortedOffers = offers.sort((a, b) => b.qty - a.qty);

      // Find the best applicable offer
      const applicableOffer = sortedOffers.find(
        (offer) => quantity >= offer.qty
      );

      if (applicableOffer) {
        const offerDetails: OfferDetails = {
          product_id: applicableOffer.product_id,
          product_name: applicableOffer.product_name,
          qty: applicableOffer.qty,
          discount_amount: Number(applicableOffer.discount_amount) || 0,
          sample_id: applicableOffer.sample_id || null,
          sample_product_name: applicableOffer.sample_product_name || null,
          sample_qty: Number(applicableOffer.sample_qty) || 0,
          gift_item_code: applicableOffer.gift_item_code || null,
          gift_product_name: applicableOffer.gift_product_name || null,
          gift_item_qty: Number(applicableOffer.gift_item_qty) || 0,
          additional_discount_amount:
            Number(applicableOffer.additional_discount_amount) || 0,
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

  const handleUpdateQuantity = async () => {
    if (!selectedProduct || updatedQty === "") return;

    const offerDetails = await getOffer(Number(updatedQty));

    const updatedQuantity = Number(updatedQty);

    // Check if updatedQty exceeds available stock
    if (stockData && updatedQuantity > stockData.stock) {
      alert(
        `Cannot update quantity. Available stock is only ${stockData.stock}.`
      );
      return;
    }

    const updatedList = selectedProductList.map((product) =>
      product.id === selectedProduct.id
        ? { ...product, quantity: updatedQty, offer: offerDetails } // Update only the quantity
        : product
    );

    // Update the state when ith the updated product list
    setSelectedProductList(updatedList);

    // Save the updated list to localStorage
    localStorage.setItem("selectedProductList", JSON.stringify(updatedList));

    // Close the modal and reset states
    setUpdatedQty("");
    closeEditPopup();
  };

  // Function to delete a product
  const handleDeleteProduct = (productId: number) => {
    const updatedList = selectedProductList.filter(
      (product) => product.id !== productId
    );
    setSelectedProductList(updatedList);
    localStorage.setItem("selectedProductList", JSON.stringify(updatedList));
  };

  useEffect(() => {
    let qty = 0;
    let amount = 0;
    let discount = 0;
    let additional_discount_amount = 0;

    // Sum up the quantity and amount of all selected products
    selectedProductList.forEach((product) => {
      qty += Number(product.quantity);
      amount += Number(Number(product.quantity) * Number(product.price));
      if (product.offer) {
        if (product.offer?.discount_amount) {
          discount += Number(product.offer?.discount_amount);
        }
        if (product.offer?.additional_discount_amount) {
          additional_discount_amount += Number(
            product.offer?.additional_discount_amount
          );
        }
      }
    });

    setTotalQty(qty);
    setTotalAmount(amount);
    setTotalDiscount(discount);
    setTotalAdditionalDiscountAmount(additional_discount_amount);
  }, [selectedProductList]);

  const handleVisitClick = () => {
    setShowVisitPopup(true); // Show popup when Visit button is clicked
  };

  const handleSaveVisit = async () => {
    if (selectedVisitType) {
      const orderData: OrderData = {
        userId: userId,
        retailerId: selectedRetailer.id.toString(),
        visitType: selectedVisitType,
        latitude: latitude,
        longitude: longitude,
      };

      try {
        const response = await fetch("/api/saveVisit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          console.log(response);
          alert("Visit saved successfully!");
          setShowVisitPopup(false); // Close popup
          setSelectedVisitType(""); // Reset dropdown
          setSelectedRoute({ name: "Select Route", id: 0 }); // Reset route
          setSelectedRetailer({ retailer_name: "Select Retailer", id: 0 }); // Reset retailer
          clearSelectedLocalStorage();
        } else {
          const errorData = await response.json();
          alert(`Failed to save visit: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error saving visit:", error);
        alert("An error occurred while saving the visit.");
      }
    } else {
      alert("Please select a visit type!");
    }
  };

  const handleSaveOrder = async () => {
    if (selectedProductList) {
      const orderData: OrderData = {
        visitType: "",
        userId: userId,
        retailerId: selectedRetailer.id.toString(),
        latitude: latitude,
        longitude: longitude,
      };
      const orderListData = [];
      for (let i = 0; i < selectedProductList.length; i++) {
        const totalAmount =
          Number(selectedProductList[i].quantity) *
          Number(selectedProductList[i].price);
        let discount_amount: number = 0;
        let is_sample: number = 0;
        let is_gift: number = 0;
        if (selectedProductList[i].offer) {
          discount_amount =
            Number(selectedProductList[i].offer?.discount_amount) +
            Number(selectedProductList[i].offer?.additional_discount_amount);
          if (selectedProductList[i].offer?.sample_id) {
            is_sample = 1;
          }
          if (selectedProductList[i].offer?.gift_item_code) {
            is_gift = 1;
          }
        }
        orderListData.push({
          product_id: selectedProductList[i].id,
          price: selectedProductList[i].price,
          qty: Number(selectedProductList[i].quantity),
          org_total: totalAmount,
          total: totalAmount - discount_amount,
          ctn_factor: selectedProductList[i].ctn_factor,
          discount_amount: discount_amount,
          s_discount_amount: Number(selectedProductList[i].offer?.discount_amount),
          additional_discount_amount: Number(selectedProductList[i].offer?.additional_discount_amount),
          product_status: "Continue",
          is_sample: is_sample ? 1 : 0,
          sample_product_code: is_sample ? selectedProductList[i].offer?.sample_id : null,
          sample_qty: is_sample ? selectedProductList[i].offer?.sample_qty : 0,
          is_gift: is_gift === 1 ? 1 : 0,
          gift_item_code: is_gift === 1 ? selectedProductList[i].offer?.gift_item_code : null,
          gift_item_qty: is_gift === 1 ? selectedProductList[i].offer?.gift_item_qty : 0,
        });
      }
      try {
        const response = await fetch("/api/saveOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderData, orderListData }),
        });

        if (response.ok) {
          alert("Order saved successfully!");
          setShowVisitPopup(false); // Close popup
          setSelectedVisitType(""); // Reset dropdown
          setSelectedRoute({ name: "Select Route", id: 0 }); // Reset route
          setSelectedRetailer({ retailer_name: "Select Retailer", id: 0 }); // Reset retailer
          setSelectedProductList([]);
          clearSelectedLocalStorage();
        } else {
          const errorData = await response.json();
          alert(`Failed to save order: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error saving order:", error);
        alert("An error occurred while saving the order.");
      }
    } else {
      alert("Please select a order type!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-gray-100">
      {/* Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        {/* Route Dropdown */}
        <div className="relative w-full max-w-md">
          <label className="text-sm font-medium text-gray-500 absolute -top-2.5 left-3 px-1">
            Route
          </label>
          <div
            onClick={() => {
                if(userId) {
                    router.push('/route-list')
                }else {
                    alert("User ID is missing. Please check the URL parameters.");
                }
            }}
            className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer flex justify-between items-center bg-white hover:border-gray-400 transition duration-200"
          >
            <span className="text-gray-700 text-sm">{selectedRoute.name}</span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>

        {/* Retailer */}
        <div className="relative w-full max-w-md">
          <label className="text-sm font-medium text-gray-500 absolute -top-2.5 left-3 px-1">
            Retailer
          </label>
          <div
            onClick={() => {
                if(userId) {
                    router.push(`/retailer-list?route_id=${selectedRoute.id}`);
                }else {
                    alert("User ID is missing. Please check the URL parameters.");
                }
            }}
            className="w-full p-3 border border-gray-300 rounded-lg cursor-pointer flex justify-between items-center bg-white hover:border-gray-400 transition duration-200"
          >
            <span className="text-gray-700 text-sm truncate">
              {selectedRetailer.retailer_name}{" "}
              <span className="text-gray-500 text-xs">
                (ID: {selectedRetailer.id})
              </span>
            </span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>

        {selectedRoute.id && selectedRetailer.id ? (
          <div className="flex gap-4 w-full">
            {/* Visit Button */}
            <button
              onClick={handleVisitClick}
              disabled={selectedProductList.length > 0}
              className={`py-2 px-4 font-medium rounded-lg transition duration-200 ${
                selectedProductList.length > 0
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed" // Disabled state
                  : "bg-green-600 text-white hover:bg-green-700" // Active state
              }`}
            >
              Visit
            </button>

            {/* Add Product Button */}
            <button
              onClick={() =>
                router.push(
                  `/product-list?category_id=${selectedProductCategory.id}`
                )
              }
              className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Add Product
            </button>
          </div>
        ) : null}
      </div>

      {/* Product List Table */}
      {selectedProductList.length > 0 && (
        <div className="w-full max-w-6xl mt-3 mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 rounded-xl shadow-xl max-w-md mx-auto transition transform hover:scale-105 hover:shadow-2xl mb-3">
            <div className="flex justify-between items-center text-gray-700">
              <span className="font-extrabold text-xs tracking-wider text-gray-800">
                Order Date:
              </span>
              <span className="text-xs text-gray-500">{currentDate}</span>
            </div>
            <div className="flex justify-between items-center text-gray-700">
              <span className="font-extrabold text-xs tracking-wider text-gray-800">
                Total Qty:
              </span>
              <span className="text-xs text-indigo-600">{totalQty}</span>
            </div>
            {totalDiscount || totalAdditionalDiscountAmount ? (
              <div className="flex justify-between items-center text-gray-700">
                <span className="font-extrabold text-xs tracking-wider text-red-800">
                  Total Discount:
                </span>
                <span className="text-xs text-red-600">
                  ৳
                  {Number(
                    totalDiscount + totalAdditionalDiscountAmount
                  ).toFixed(2)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between items-center text-gray-700">
              <span className="font-extrabold text-xs tracking-wider text-gray-800">
                Total Amount:
              </span>
              <span className="text-xs text-green-600">
                ৳
                {Number(
                  totalAmount - (totalDiscount + totalAdditionalDiscountAmount)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {selectedProductList.map((product) => (
              <div
                key={product.id}
                className="relative bg-gray-50 border border-gray-300 rounded-md pt-4 pl-6 pr-2 pb-2  shadow-sm hover:shadow-md transition duration-300 ease-in-out"
              >
                <button
                  onClick={() => handleProductClick(product)}
                  className="absolute top-4 left-1 text-blue-500 hover:text-blue-700 transition duration-200"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="absolute top-1 right-1 text-red-500 hover:text-red-700 transition duration-200"
                >
                  <FiTrash2 size={18} />
                </button>

                {/* Product Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 leading-tight line-clamp-2">
                    {product.product_name} ({product.id})
                  </h3>
                  <div className="text-xs text-gray-700">
                    <span className="text-gray-900 font-bold">
                      ৳
                      {Number(product.price).toLocaleString("en-BD", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    ×
                    <span className="text-gray-900 font-bold">
                      {product.quantity}
                    </span>
                    =
                    {product.offer?.discount_amount ||
                    product.offer?.additional_discount_amount ? (
                      <span className="text-gray-900 font-bold">
                        ৳
                        {(
                          Number(product.price) * Number(product.quantity)
                        ).toLocaleString("en-BD", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <span className="text-green-700 font-bold">
                        ৳
                        {(
                          Number(product.price) * Number(product.quantity)
                        ).toLocaleString("en-BD", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                    {product.offer?.discount_amount ||
                    product.offer?.additional_discount_amount ? (
                      <>
                        -
                        <span className="text-red-600 font-bold">
                          ৳
                          {Number(
                            Number(product.offer.discount_amount) +
                              product.offer.additional_discount_amount
                          ).toLocaleString("en-BD", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        =
                        <span className="text-green-700 font-bold">
                          ৳
                          {(
                            Number(product.price) * Number(product.quantity) -
                            (Number(product.offer.discount_amount) +
                              Number(product.offer.additional_discount_amount))
                          ).toLocaleString("en-BD", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </>
                    ) : null}
                  </div>
                  {product.offer?.sample_id ? (
                    <p className="text-xs text-gray-600 mb-1 mt-1 p-2 bg-gradient-to-r from-blue-100 to-blue-300 rounded-lg shadow-md">
                      <span className="font-medium text-gray-700">
                        Sample Product:
                      </span>{" "}
                      {product.offer?.sample_product_name} | Qty:{" "}
                      {product.offer?.sample_qty}
                    </p>
                  ) : null}
                  {product.offer?.gift_item_code ? (
                    <p className="text-xs text-gray-600 mb-1 mt-1 p-2 bg-gradient-to-r from-green-100 to-green-300 rounded-lg shadow-md">
                      <span className="font-medium text-gray-700">
                        Gift Item:
                      </span>{" "}
                      {product.offer?.gift_product_name} | Qty:{" "}
                      {product.offer?.gift_item_qty}
                    </p>
                  ) : null}
                  {product.offer?.additional_discount_amount ? (
                    <p className="text-xs text-gray-600 mb-1 p-2 bg-gradient-to-r from-red-100 to-red-300 rounded-lg shadow-md">
                      <span className="font-medium text-gray-700">
                        Additional Discount:
                      </span>{" "}
                      ৳{product.offer?.additional_discount_amount}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Quantity Modal */}
      {isEditPopupOpen && stockData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Edit Quantity
            </h3>
            <h3 className="text-sm font-semibold text-gray-800 mb-1 truncate">
              {selectedProduct?.product_name}
            </h3>

            <div className="mb-4">
              <label className="block text-gray-700">
                Available Stock: {stockData.stock}
              </label>
              <label className="block text-gray-700">
                Stock per Unit: {stockData.stock_per_pis}
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={updatedQty}
              onChange={(e) => setUpdatedQty(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={closeEditPopup}
                className="text-sm text-gray-500 hover:text-gray-700 mr-4"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateQuantity}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visit Modal */}
      {showVisitPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h3 className="text-lg font-semibold mb-4">Select Visit Type</h3>

            {/* Dropdown */}
            <select
              value={selectedVisitType}
              onChange={(e) => setSelectedVisitType(e.target.value)}
              className="w-full p-2 border rounded-md mb-4"
            >
              <option value="" disabled>
                Select a visit type
              </option>
              {visitType.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowVisitPopup(false)} // Close without saving
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVisit} // Save action
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Order Button */}
      {selectedProductList.length > 0 && (
        <div className="mt-6 w-full flex justify-center">
          <button
            onClick={handleSaveOrder}
            className="py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200"
          >
            Save Order
          </button>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={() => {
          setSelectedVisitType(""); // Reset dropdown
          setSelectedRoute({ name: "Select Route", id: 0 }); // Reset route
          setSelectedRetailer({ retailer_name: "Select Retailer", id: 0 }); // Reset retailer
          setSelectedProductList([]);
          clearSelectedLocalStorage();
        }}
        className="absolute bottom-4 left-4 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition duration-200"
      >
        <FontAwesomeIcon icon={faUndo} size="lg" />
      </button>
    </div>
  );
}
