import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, Pill, Search } from 'lucide-react';

const Navbar = ({ cartCount }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="glass-card" style={{ position: 'sticky', top: '1rem', zIndex: 50, marginBottom: '2rem' }}>
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>

                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                        <Pill size={32} />
                        <span>Brasil Mais</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div style={{ display: 'none', gap: '2rem', alignItems: 'center' }} className="desktop-menu">
                        <Link to="/" className="nav-link">Início</Link>
                        <Link to="/catalog" className="nav-link">Catálogo</Link>
                        <Link to="/admin" className="nav-link">Área Admin</Link>
                    </div>

                    <style>{`
            @media (min-width: 768px) {
              .desktop-menu { display: flex !important; }
              .mobile-btn { display: none !important; }
            }
          `}</style>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.5rem' }}>
                            <Search size={20} />
                        </button>

                        <Link to="/cart" className="btn btn-primary" style={{ padding: '0.5rem 1rem', position: 'relative' }}>
                            <ShoppingCart size={20} />
                            <span style={{ marginLeft: '0.5rem' }}>Carrinho</span>
                            {cartCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    background: 'var(--color-secondary)',
                                    color: 'var(--color-text)',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <button className="mobile-btn btn btn-outline" onClick={() => setIsOpen(!isOpen)} style={{ padding: '0.5rem' }}>
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Link to="/" onClick={() => setIsOpen(false)}>Início</Link>
                            <Link to="/catalog" onClick={() => setIsOpen(false)}>Catálogo</Link>
                            <Link to="/admin" onClick={() => setIsOpen(false)}>Área Admin</Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
