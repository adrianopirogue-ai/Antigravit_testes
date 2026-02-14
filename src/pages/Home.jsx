import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Phone, Sparkles, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Home = () => {
    const [featuredMedicines, setFeaturedMedicines] = useState([]);

    useEffect(() => {
        fetchFeaturedMedicines();
    }, []);

    const fetchFeaturedMedicines = async () => {
        try {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .limit(3);

            if (!error && data) {
                setFeaturedMedicines(data.map(med => ({
                    ...med,
                    image: med.image_url,
                    wholesalePrice: med.wholesale_price
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar destaques:', error);
        }
    };

    return (
        <div className="container">
            {/* Hero Section - Melhorado */}
            <section style={{
                textAlign: 'center',
                padding: '5rem 1rem',
                marginBottom: '4rem',
                position: 'relative'
            }} className="fade-in">
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(0, 156, 59, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: -1
                }}></div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Sparkles size={24} color="#009c3b" />
                    <span className="badge badge-success">Distribuidora Oficial ANVISA</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1.5rem',
                    fontWeight: '900',
                    letterSpacing: '-0.02em'
                }}>
                    Distribuidora Brasil Mais
                </h1>

                <p style={{
                    fontSize: '1.35rem',
                    color: 'var(--color-text-muted)',
                    maxWidth: '700px',
                    margin: '0 auto 3rem',
                    lineHeight: '1.7'
                }}>
                    A solução completa em medicamentos para <strong style={{ color: 'var(--color-primary)' }}>farmácias, hospitais e consumidores</strong>. Qualidade garantida, logística eficiente e os melhores preços do mercado.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/catalog" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                        Ver Catálogo <ArrowRight size={20} />
                    </Link>
                    <Link to="/admin" className="btn btn-outline" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                        Área Administrativa
                    </Link>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '2rem',
                    marginTop: '4rem',
                    maxWidth: '600px',
                    margin: '4rem auto 0'
                }}>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>500+</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Medicamentos</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>24h</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Atendimento</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>99%</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Satisfação</div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            {featuredMedicines.length > 0 && (
                <section style={{ marginBottom: '4rem' }} className="slide-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <TrendingUp size={28} color="var(--color-primary)" />
                        <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Produtos em Destaque</h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {featuredMedicines.map(med => (
                            <Link to="/catalog" key={med.id} style={{ textDecoration: 'none' }}>
                                <div className="glass-card" style={{ overflow: 'hidden', position: 'relative' }}>
                                    <span className="badge badge-warning" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1 }}>
                                        🔥 Destaque
                                    </span>
                                    <img
                                        src={med.image}
                                        alt={med.name}
                                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                    />
                                    <div style={{ padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                                            {med.name}
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                            {med.description}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                                R$ {med.price?.toFixed(2)}
                                            </span>
                                            <span className="badge badge-info">Em estoque</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Feature Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem'
            }}>
                <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #009c3b, #007a2d)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(0, 156, 59, 0.3)'
                    }}>
                        <Truck size={40} color="white" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: '700' }}>Logística Rápida</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                        Entrega expressa para todo o Brasil com rastreamento em tempo real e garantia de qualidade.
                    </p>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #002776, #001a5c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(0, 39, 118, 0.3)'
                    }}>
                        <ShieldCheck size={40} color="white" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: '700' }}>Qualidade Garantida</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                        Todos os medicamentos certificados pela ANVISA com controle rigoroso de procedência.
                    </p>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
                    }}>
                        <Award size={40} color="white" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: '700' }}>Atendimento 24h</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                        Suporte especializado para farmacêuticos e parceiros comerciais a qualquer hora.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
