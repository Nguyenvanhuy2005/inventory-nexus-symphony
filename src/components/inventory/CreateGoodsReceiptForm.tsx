import React, { useState, useEffect } from 'react';
import { useGetProducts } from '@/hooks/api-hooks';
import { Product as ModelProduct } from '@/types/models';

// Add a conversion function to help with type compatibility between WooCommerce Product and our model Product
const convertWooCommerceProduct = (product: any): ModelProduct => {
  return {
    id: product.id,
    name: product.name || '',
    slug: product.slug || '',
    sku: product.sku || '',
    price: product.price || '',
    regular_price: product.regular_price || '',
    sale_price: product.sale_price || '',
    stock_quantity: product.stock_quantity || 0,
    stock_status: product.stock_status || 'instock',
    description: product.description || '',
    short_description: product.short_description || '',
    categories: product.categories || [],
    manage_stock: product.manage_stock || false,
    featured: product.featured || false,
    images: (product.images || []).map((img: any) => ({
      id: img.id,
      src: img.src,
      name: img.name || img.alt || 'product image',
    })),
    type: product.type || 'simple',
    real_stock: product.stock_quantity || 0,
    available_to_sell: product.stock_quantity || 0,
    pending_orders: 0,
    attributes: product.attributes || [],
  };
};
