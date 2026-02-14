import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import AdminDashboard from './pages/Admin/Dashboard';

import Cart from './pages/Cart';

function App() {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (product, quantity = 1) => {
        const existingItemIndex = cartItems.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            const newCart = [...cartItems];
            newCart[existingItemIndex].quantity += quantity;
            setCartItems(newCart);
            alert(`Quantidade atualizada: ${newCart[existingItemIndex].quantity} un. de ${product.name}`);
        } else {
            setCartItems([...cartItems, { ...product, quantity }]);
            alert(`${quantity}x ${product.name} adicionado ao carrinho!`);
        }
    };

    return (
        <Router>
            <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
                <Navbar cartCount={cartItems.length} />

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog addToCart={addToCart} />} />
                    <Route path="/cart" element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
