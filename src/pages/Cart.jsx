import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trash2, ArrowRight } from 'lucide-react';

const Cart = ({ cartItems, setCartItems }) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [checkoutError, setCheckoutError] = useState('');
    const [checkoutSuccess, setCheckoutSuccess] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const navigate = useNavigate();
    const getPromoPercent = (item) => Number(item.promoPercent ?? item.promo_percent ?? 0);

    const applyPromo = (price, item) => {
        const promo = getPromoPercent(item);
        if (!promo || promo <= 0) return price;
        return price * (1 - promo / 100);
    };

    const resolvePrice = (item) => {
        let basePrice;
        if (item.priceType === 'wholesale') basePrice = item.wholesalePrice;
        else if (item.priceType === 'retail') basePrice = item.price;
        else basePrice = item.quantity >= 10 ? item.wholesalePrice : item.price;
        return applyPromo(basePrice, item);
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

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session) {
            setProfile(null);
            return;
        }

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar perfil:', error);
                return;
            }
            setProfile(data || null);
        };

        fetchProfile();
    }, [session]);

    const handleCheckout = async () => {
        setCheckoutError('');
        setCheckoutSuccess('');
        if (!session) {
            setCheckoutError('Faça login para finalizar a compra.');
            return;
        }
        if (!profile) {
            setCheckoutError('Complete seu cadastro antes de finalizar a compra.');
            return;
        }
        if (cartItems.length === 0) return;

        setIsCheckingOut(true);
        try {
            // 1. Validar estoque antes de processar
            console.log('Validando estoque...');
            const medicineIds = cartItems.map(item => item.id);
            const { data: dbMedicines, error: stockQueryError } = await supabase
                .from('medicines')
                .select('id, name, stock')
                .in('id', medicineIds);

            if (stockQueryError) throw stockQueryError;

            for (const item of cartItems) {
                const dbItem = dbMedicines.find(m => m.id === item.id);
                if (!dbItem) throw new Error(`Produto não encontrado: ${item.name}`);
                if (dbItem.stock < item.quantity) {
                    throw new Error(`Estoque insuficiente para ${item.name}. Disponível: ${dbItem.stock}`);
                }
            }

            // 2. Criar o pedido
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    user_id: session.user.id,
                    total,
                    status: 'pending'
                }])
                .select('id')
                .single();

            if (orderError) throw orderError;

            // 3. Criar os itens do pedido
            const itemsPayload = cartItems.map((item) => ({
                order_id: orderData.id,
                medicine_id: item.id,
                quantity: item.quantity,
                unit_price: resolvePrice(item)
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsPayload);

            if (itemsError) throw itemsError;

            // 4. Deduzir do estoque (Processo sequencial seguro neste contexto)
            console.log('Deduzindo do estoque...');
            for (const item of cartItems) {
                const dbItem = dbMedicines.find(m => m.id === item.id);
                const newStock = dbItem.stock - item.quantity;

                const { error: updateStockError } = await supabase
                    .from('medicines')
                    .update({ stock: newStock })
                    .eq('id', item.id);

                if (updateStockError) {
                    console.error(`Erro ao atualizar estoque de ${item.name}:`, updateStockError);
                    // Continuamos para os outros itens, registrar o erro mas nao travar o sucesso do pedido já criado
                }
            }

            // 5. Enviar email (opcional/segundo plano)
            try {
                const { error: emailError } = await supabase.functions.invoke('send-order-email', {
                    body: { order_id: orderData.id }
                });

                if (emailError) {
                    console.warn('Erro ao enviar email do pedido:', emailError);
                    setCheckoutSuccess('Pedido registrado! O email de confirmacao sera enviado em instantes.');
                } else {
                    setCheckoutSuccess('Pedido registrado! Enviamos a confirmacao para seu email.');
                }
            } catch (error) {
                console.warn('Falha ao chamar funcao de email:', error);
                setCheckoutSuccess('Pedido registrado! O email de confirmacao sera enviado em instantes.');
            }

            setCartItems([]);
            setCheckoutSuccess('Pedido confirmado! Redirecionando para o catálogo...');
            setTimeout(() => {
                navigate('/catalog', { replace: true });
            }, 500);
        } catch (error) {
            console.error('Erro ao finalizar compra:', error);
            setCheckoutError(error.message || 'Erro ao finalizar a compra.');
        } finally {
            setIsCheckingOut(false);
        }
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
                                const promoPercent = getPromoPercent(item);

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
                                                {promoPercent > 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>
                                                        Promoção -{promoPercent}%
                                                    </span>
                                                )}
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

                        {!authLoading && !session && (
                            <div style={{ padding: '0.75rem 1rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                Para finalizar, faca login na <Link to="/cliente" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Area do Cliente</Link>.
                            </div>
                        )}

                        {!authLoading && session && !profile && (
                            <div style={{ padding: '0.75rem 1rem', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                Complete seu cadastro na <Link to="/cliente" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Area do Cliente</Link> para finalizar.
                            </div>
                        )}

                        {checkoutError && (
                            <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                {checkoutError}
                            </div>
                        )}

                        {checkoutSuccess && (
                            <div style={{ padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                {checkoutSuccess}
                            </div>
                        )}

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
                            disabled={cartItems.length === 0 || !session || !profile || isCheckingOut}
                            className="btn btn-primary"
                            style={{ width: '100%', opacity: cartItems.length === 0 || !session || !profile || isCheckingOut ? 0.5 : 1 }}
                        >
                            {isCheckingOut ? 'Finalizando...' : <>Finalizar Compra <ArrowRight size={20} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
