/**
 * @FILE: MerchandiseCatalogView.jsx
 * @RESPONSIBILITY: Dense Odoo apparel catalog with tabs for apparel browsing, personal orders tracking, and admin delivery advancement.
 * @DEPENDENCIES: react, lucide-react, react-router-dom, apiNetworkClient.js, ControlPanelHeader.jsx, SalesOrderCheckoutModal.jsx, AuthenticationContext.jsx, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Active tab selection, order fulfillment actions, and POS triggers.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Tag, Check, Box, Layers, ShieldCheck, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { SalesOrderCheckoutModal } from './SalesOrderCheckoutModal.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const MerchandiseCatalogView = () => {
  const [activeTab, setActiveTab] = useState('CATALOG');
  const [products, setProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [selectedSizeMap, setSelectedSizeMap] = useState({});
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdminOrOperations } = useAuthentication();
  const { runWithProcessingLock } = useSystemProcessing();

  const isClubMember = currentUser?.userRoleTier === 'MEMBER' || currentUser?.userRoleTier === 'ADMIN' || currentUser?.userRoleTier === 'OPERATIONS';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const prodRes = await apiNetworkClient.get('/merchandise/products');
      if (prodRes.data?.successIndicator) {
        setProducts(prodRes.data.productsList);
        const initialSizes = {};
        prodRes.data.productsList.forEach((prod) => {
          initialSizes[prod._id] = prod.sizeMatrixStock?.[0]?.sizeVariant || 'M';
        });
        setSelectedSizeMap(initialSizes);
      }
      await loadOrders();
    } catch (err) {
      console.error('Failed to load merchandise data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const endpoint = isAdminOrOperations() ? '/merchandise/orders/all' : '/merchandise/orders/my-orders';
      const ordRes = await apiNetworkClient.get(endpoint);
      if (ordRes.data?.successIndicator) {
        setUserOrders(ordRes.data.ordersList);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkDelivered = async (orderId) => {
    await runWithProcessingLock(async () => {
      await apiNetworkClient.put(`/merchandise/orders/${orderId}/state`, {
        targetLifecycleState: 'DONE'
      });
      await loadOrders();
    }, 'Marking order as delivered...');
  };

  const handleSizeChange = (productId, sizeVariant) => {
    setSelectedSizeMap((prev) => ({ ...prev, [productId]: sizeVariant }));
  };

  const handleOpenOrder = (prod) => {
    setSelectedProductForOrder(prod);
    setIsCheckoutModalOpen(true);
  };

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Merchandise POS', path: '/merchandise' },
    { label: activeTab === 'CATALOG' ? 'Apparel Store' : 'Your Orders' }
  ];

  const actionButtons = (
    <div className="flex items-center space-x-2">
      {isAdminOrOperations() && (
        <Link to="/merchandise/stock-ledger" className="btn-secondary-action flex items-center space-x-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Stock Transfers Ledger</span>
        </Link>
      )}
    </div>
  );

  const renderFulfillmentBadge = (order) => {
    if (order.lifecycleState === 'DONE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> DELIVERED
        </span>
      );
    }
    if (order.deliveryMethod === 'CAMPUS_TABLE_PICKUP') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-blue-100 text-blue-800">
          <Package className="w-3 h-3 mr-1 text-blue-600" /> READY_FOR_PICKUP
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800">
        <Clock className="w-3 h-3 mr-1 text-amber-600" /> RESERVED
      </span>
    );
  };

  const renderOrdersTable = () => (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-odoo-primary" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            {isAdminOrOperations() ? 'All Club Merchandise Orders' : 'Your Merchandise Orders'}
          </h2>
        </div>
        <span className="text-2xs font-semibold text-slate-500">{userOrders.length} Order(s)</span>
      </div>

      {userOrders.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">No merchandise orders found.</div>
      ) : (
        <table className="w-full text-left border-collapse text-2xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
              <th className="py-2 px-3">Order Code</th>
              {isAdminOrOperations() && <th className="py-2 px-3">Customer</th>}
              <th className="py-2 px-3">Items Ordered</th>
              <th className="py-2 px-3">Fulfillment</th>
              <th className="py-2 px-3">Total Paid</th>
              <th className="py-2 px-3">Status</th>
              {isAdminOrOperations() && <th className="py-2 px-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {userOrders.map((ord) => (
              <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-odoo-primary">
                  {ord.salesOrderSequenceCode}
                </td>
                {isAdminOrOperations() && (
                  <td className="py-2.5 px-3 text-slate-800">
                    <div>{ord.customerUserId?.fullName || 'Club Member'}</div>
                    <div className="text-3xs text-slate-500 font-mono">
                      {ord.customerUserId?.studentIdentificationNumber}
                    </div>
                  </td>
                )}
                <td className="py-2.5 px-3">
                  <div className="space-y-0.5">
                    {ord.orderLineItems?.map((li, idx) => (
                      <div key={idx} className="font-semibold text-slate-800">
                        {li.orderQuantity}x {li.productName} ({li.selectedSizeVariant})
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  <div>{ord.deliveryMethod === 'CAMPUS_TABLE_PICKUP' ? 'Booth Pickup' : 'Dorm Delivery'}</div>
                  {ord.specialDeliveryNotes && (
                    <div className="text-3xs text-slate-500 truncate max-w-xs">{ord.specialDeliveryNotes}</div>
                  )}
                </td>
                <td className="py-2.5 px-3 font-bold text-emerald-700">₹{ord.grossTotalAmount}</td>
                <td className="py-2.5 px-3">{renderFulfillmentBadge(ord)}</td>
                {isAdminOrOperations() && (
                  <td className="py-2.5 px-3 text-right">
                    {ord.lifecycleState !== 'DONE' && (
                      <button
                        onClick={() => handleMarkDelivered(ord._id)}
                        className="px-2 py-1 text-3xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div
      data-component="MerchandiseCatalogView"
      data-purpose="apparel-store-catalog"
      className="flex flex-col h-full bg-slate-50"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      <div className="bg-white border-b border-slate-200 px-6 pt-3 flex space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'CATALOG'
              ? 'border-odoo-primary text-odoo-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Apparel Store</span>
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'ORDERS'
              ? 'border-odoo-primary text-odoo-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Your Orders ({userOrders.length})</span>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'ORDERS' ? (
            renderOrdersTable()
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Skyline Branded Apparel & Merch
                </h1>
                <span className="text-2xs font-semibold text-slate-500">
                  Showing {products.length} products
                </span>
              </div>

              {isLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading catalog items...</div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-lg">
                  No merchandise products available in catalog.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product) => {
                    const currentSelectedSize = selectedSizeMap[product._id] || 'M';
                    const currentSizeStock = product.sizeMatrixStock?.find(
                      (s) => s.sizeVariant === currentSelectedSize
                    )?.currentInventoryCount || 0;

                    return (
                      <div
                        key={product._id}
                        className="bg-white border border-odoo-border rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <span className="text-2xs font-mono font-bold text-odoo-primary bg-odoo-primary/10 px-2 py-0.5 rounded border border-odoo-primary/20">
                              {product.skuIdentifier}
                            </span>
                            <span className="px-2 py-0.5 text-2xs font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {product.productCategory}
                            </span>
                          </div>

                          <div>
                            <h2 className="text-base font-bold text-slate-900">{product.productName}</h2>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1">{product.productDescription}</p>
                          </div>

                          <div className="flex items-baseline space-x-3 p-3 bg-slate-50 rounded border border-slate-200">
                            <div>
                              <span className="text-2xs font-bold text-emerald-800 block">Member Price</span>
                              <span className="text-sm font-bold text-emerald-700">₹{product.memberPriceAmount}</span>
                            </div>
                            <div className="border-l border-slate-200 pl-3">
                              <span className="text-2xs font-semibold text-slate-500 block">Non-Member Rate</span>
                              <span className="text-xs font-semibold text-slate-600">₹{product.nonMemberPriceAmount}</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-2xs font-bold text-slate-600 uppercase">Select Size:</span>
                              <span className={`text-2xs font-bold ${currentSizeStock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {currentSizeStock > 0 ? `${currentSizeStock} in stock` : 'Out of Stock'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {product.sizeMatrixStock?.map((sizeObj) => (
                                <button
                                  key={sizeObj.sizeVariant}
                                  onClick={() => handleSizeChange(product._id, sizeObj.sizeVariant)}
                                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded border transition-all ${
                                    currentSelectedSize === sizeObj.sizeVariant
                                      ? 'border-odoo-primary bg-odoo-primary text-white shadow-xs'
                                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {sizeObj.sizeVariant}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                          <span className="text-2xs text-slate-500">Immutable Double-Entry Stock Transfer</span>
                          <button
                            onClick={() => handleOpenOrder(product)}
                            disabled={currentSizeStock === 0}
                            className="btn-primary-action flex items-center space-x-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Order Now</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SalesOrderCheckoutModal
        isOpen={isCheckoutModalOpen}
        product={selectedProductForOrder}
        selectedSize={selectedProductForOrder ? selectedSizeMap[selectedProductForOrder._id] || 'M' : 'M'}
        isMember={isClubMember}
        onClose={() => setIsCheckoutModalOpen(false)}
        onOrderPlaced={() => loadData()}
      />
    </div>
  );
};
