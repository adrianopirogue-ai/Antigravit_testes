import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import AdminDashboard from './pages/Admin/Dashboard';
import ForgotPassword from './pages/Admin/ForgotPassword';
import ResetPassword from './pages/Admin/ResetPassword';

import Cart from './pages/Cart';

function App() {
    const [cartItems, setCartItems] = useState([]);

    console.log('🚀 App carregado. Base URL:', import.meta.env.BASE_URL);

    const addToCart = (product, quantity = 1, priceType = 'retail') => {
        const normalizedType = priceType === 'wholesale' ? 'wholesale' : 'retail';
        const existingItemIndex = cartItems.findIndex(item => item.id === product.id && item.priceType === normalizedType);

        if (existingItemIndex > -1) {
            const newCart = [...cartItems];
            newCart[existingItemIndex].quantity += quantity;
            setCartItems(newCart);
            alert(`Quantidade atualizada: ${newCart[existingItemIndex].quantity} un. de ${product.name} (${normalizedType === 'wholesale' ? 'atacado' : 'varejo'})`);
        } else {
            setCartItems([...cartItems, { ...product, quantity, priceType: normalizedType }]);
            alert(`${quantity}x ${product.name} adicionado ao carrinho (${normalizedType === 'wholesale' ? 'atacado' : 'varejo'})!`);
        }
    };

    return (
        <Router basename={import.meta.env.BASE_URL}>
            <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
                <Navbar cartCount={cartItems.length} />

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog addToCart={addToCart} />} />
                    <Route path="/cart" element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/forgot-password" element={<ForgotPassword />} />
                    <Route path="/admin/reset-password" element={<ResetPassword />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
