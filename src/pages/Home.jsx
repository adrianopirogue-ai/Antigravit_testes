import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Phone } from 'lucide-react';

const Home = () => {
    return (
        <div className="container">
            {/* Hero Section */}
            <section style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                marginBottom: '4rem'
            }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1.5rem',
                    fontWeight: '800'
                }}>
                    Distribuidora Brasil Mais
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--color-text-muted)',
                    maxWidth: '700px',
                    margin: '0 auto 2.5rem'
                }}>
                    A solução completa em medicamentos para farmácias, hospitais e consumidores.
                    Qualidade garantida, logística eficiente e os melhores preços do mercado.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/catalog" className="btn btn-primary">
                        Ver Catálogo <ArrowRight size={20} />
                    </Link>
                    <Link to="/about" className="btn btn-outline">
                        Saiba Mais
                    </Link>
                </div>
            </section>

            {/* Feature Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem'
            }}>
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <Truck size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Logística Rápida</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Entrega expressa para todo o Brasil com rastreamento em tempo real.
                    </p>
                </div>

                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <ShieldCheck size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Qualidade Garantida</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Todos os medicamentos certificados pela ANVISA com controle rigoroso.
                    </p>
                </div>

                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <Phone size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Atendimento 24h</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Suporte especializado para farmacêuticos e parceiros comerciais.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
