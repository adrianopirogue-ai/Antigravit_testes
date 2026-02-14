import React from 'react';
import { Trash2, ArrowRight } from 'lucide-react';

const Cart = ({ cartItems, setCartItems }) => {
    const resolvePrice = (item) => {
        if (item.priceType === 'wholesale') return item.wholesalePrice;
        if (item.priceType === 'retail') return item.price;
        return item.quantity >= 10 ? item.wholesalePrice : item.price;
    };

    const resolvePriceLabel = (item) => {
        if (item.priceType === 'wholesale') return 'Atacado';
        if (item.priceType === 'retail') return 'Varejo';
        return item.quantity >= 10 ? 'Atacado' : 'Varejo';
    };

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => {
            const price = resolvePrice(item);
            return acc + (price * item.quantity);
        }, 0);
    };

    const total = calculateTotal();

    const removeItem = (index) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        setCartItems(newCart);
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) return;
        alert('Pedido realizado com sucesso! Em breve você receberá os detalhes da entrega.');
        setCartItems([]);
    };

    return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem', color: 'var(--color-primary-dark)' }}>Seu Carrinho</h1>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Cart Items */}
                <div style={{ flex: 2, minWidth: '300px' }}>
                    {cartItems.length === 0 ? (
                        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p>Seu carrinho está vazio.</p>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            {cartItems.map((item, index) => {
                                const currentPrice = resolvePrice(item);
                                const priceLabel = resolvePriceLabel(item);

                                return (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        borderBottom: index < cartItems.length - 1 ? '1px solid var(--color-border)' : 'none'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem' }}>{item.name}</h3>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.dosage}</p>
                                                {priceLabel === 'Atacado' && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                                        Preço de Atacado aplicado!
                                                    </span>
                                                )}
                                                {priceLabel === 'Varejo' && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        Preço de Varejo
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold' }}>R$ {currentPrice.toFixed(2)}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>x {item.quantity} un.</div>
                                            </div>
                                            <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '6rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Resumo do Pedido</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            <span>Subtotal</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                            <span>Frete</span>
                            <span>Grátis</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <span>Total</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cartItems.length === 0}
                            className="btn btn-primary"
                            style={{ width: '100%', opacity: cartItems.length === 0 ? 0.5 : 1 }}
                        >
                            Finalizar Compra <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
