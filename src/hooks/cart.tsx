import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const productsKey = '@GoMarketplace:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStoraged = await AsyncStorage.getItem(productsKey);

      if (productsStoraged) {
        setProducts(JSON.parse(productsStoraged));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const tempProducts = await products.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product?.quantity + 1 };
        }

        return product;
      });

      setProducts(tempProducts);
      AsyncStorage.setItem(productsKey, JSON.stringify(tempProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = await products.find(item => item.id === id);

      if (product && product?.quantity === 1) {
        const tempProducts = await products.filter(item => item.id !== id);

        setProducts(tempProducts);
        AsyncStorage.setItem(productsKey, JSON.stringify(tempProducts));
      } else if (product && product?.quantity > 1) {
        const tempProducts = await products.map(item => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity - 1 };
          }

          return item;
        });

        setProducts(tempProducts);
        AsyncStorage.setItem(productsKey, JSON.stringify(tempProducts));
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productAlreadyExist = await products.some(
        item => product.id === item.id,
      );

      if (productAlreadyExist) {
        increment(product?.id);
        return;
      }

      const tempProducts = await [...products, { ...product, quantity: 1 }];

      setProducts(tempProducts);
      AsyncStorage.setItem(productsKey, JSON.stringify(tempProducts));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
