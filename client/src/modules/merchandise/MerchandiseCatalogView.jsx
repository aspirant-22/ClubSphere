/**
 * @FILE: MerchandiseCatalogView.jsx
 * @RESPONSIBILITY: Dense Odoo apparel catalog grid displaying Hoodie and T-Shirt cards with size selectors and member pricing.
 * @DEPENDENCIES: react, lucide-react, react-router-dom, apiNetworkClient.js, ControlPanelHeader.jsx, SalesOrderCheckoutModal.jsx, AuthenticationContext.jsx.
 * @MODIFICATION_HOTSPOT: Size variant matrix selection and POS trigger.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Tag, Check, Box, Layers, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { SalesOrderCheckoutModal } from './SalesOrderCheckoutModal.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const MerchandiseCatalogView = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [selectedSizeMap, setSelectedSizeMap] = useState({});
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdminOrOperations } = useAuthentication();

  const isClubMember = Boolean(currentUser);

  const loadProductsData = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/merchandise/products');
      if (response.data?.successIndicator) {
        setProducts(response.data.productsList);
        const initialSizes = {};
        response.data.productsList.forEach((prod) => {
          initialSizes[prod._id] = prod.sizeMatrixStock?.[0]?.sizeVariant || 'M';
        });
        setSelectedSizeMap(initialSizes);
      }
    } catch (err) {
      console.error('Failed to load merchandise:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProductsData();
  }, []);

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
    { label: 'Apparel Store' }
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

  return (
    <div
      data-component="MerchandiseCatalogView"
      data-purpose="apparel-store-catalog"
      className="flex flex-col h-full bg-slate-50"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
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

                      {/* Pricing Tier Display */}
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

                      {/* Interactive Size Variant Matrix */}
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
        </div>
      </div>

      <SalesOrderCheckoutModal
        isOpen={isCheckoutModalOpen}
        product={selectedProductForOrder}
        selectedSize={selectedProductForOrder ? selectedSizeMap[selectedProductForOrder._id] || 'M' : 'M'}
        isMember={isClubMember}
        onClose={() => setIsCheckoutModalOpen(false)}
        onOrderPlaced={() => loadProductsData()}
      />
    </div>
  );
};

