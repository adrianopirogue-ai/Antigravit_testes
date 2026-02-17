import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getMedicineTypeLabel } from '../utils/medicineTypes';
import { Plus, Search } from 'lucide-react';

const Catalog = ({ addToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching medicines from Supabase...');
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .order('name');

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (!data) {
                throw new Error('Nenhum dado retornado do Supabase');
            }

            setMedicines(data.map(med => ({
                ...med,
                image: med.image_url,
                wholesalePrice: med.wholesale_price,
                requiresPrescription: med.requires_prescription,
                promoPercent: med.promo_percent ?? 0,
                promo_percent: med.promo_percent ?? 0
            })));
        } catch (err) {
            console.error('Detailed fetch error:', err);
            const errorMessage = err.message === 'Failed to fetch'
                ? 'Erro de conexão (Failed to fetch). Verifique se o banco de dados está acessível ou se há bloqueio de rede/CORS.'
                : err.message;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (medicine, priceType) => {
        const input = document.getElementById(`qty-${medicine.id}`);
        const rawQty = parseInt(input?.value, 10);
        let qty = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;

        if (priceType === 'wholesale' && qty < 10) {
            qty = 10;
            if (input) input.value = '10';
            alert('Compra no atacado requer minimo de 10 unidades. Quantidade ajustada para 10.');
        }

        addToCart(medicine, qty, priceType);
    };

    const filteredMedicines = medicines.filter(med => {
        const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            med.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || med.type === filterType;
        return matchesSearch && matchesType;
    });

    const uniqueTypes = ['All', ...new Set(medicines.map(med => med.type))];

    return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem', color: 'var(--color-primary-dark)' }}>Catálogo de Medicamentos</h1>

            {error && (
                <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    Erro ao carregar medicamentos: {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                    <p>Carregando medicamentos do banco de dados...</p>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar medicamentos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 3rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'rgba(255,255,255,0.8)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {uniqueTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`btn ${filterType === type ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem' }}
                                >
                                    {type === 'All' ? 'Todos' : getMedicineTypeLabel(type)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {filteredMedicines.map(med => {
                            const promoPercent = Number(med.promoPercent || 0);
                            const promoMultiplier = promoPercent > 0 ? (1 - promoPercent / 100) : 1;
                            const retailPrice = med.price;
                            const wholesalePrice = med.wholesalePrice;
                            const promoRetailPrice = retailPrice * promoMultiplier;
                            const promoWholesalePrice = wholesalePrice * promoMultiplier;

                            return (
                                <div key={med.id} className="glass-card fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                    {/* Stock Badge */}
                                    {med.stock < 100 && (
                                        <span className="badge badge-warning" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 1 }}>
                                            Estoque Baixo
                                        </span>
                                    )}
                                    {med.stock >= 100 && med.stock < 500 && (
                                        <span className="badge badge-info" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 1 }}>
                                            Disponível
                                        </span>
                                    )}
                                    {med.stock >= 500 && (
                                        <span className="badge badge-success" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 1 }}>
                                            ✓ Alto Estoque
                                        </span>
                                    )}
                                    {promoPercent > 0 && (
                                        <span className="badge badge-warning" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1 }}>
                                            Promo -{promoPercent}%
                                        </span>
                                    )}

                                    <div style={{ position: 'relative', height: '200px' }}>
                                        <img
                                            src={med.image}
                                            alt={med.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {med.requiresPrescription && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                background: '#dc2626',
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                                            }}>
                                                📋 Receita
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ marginBottom: '1rem', flex: 1 }}>
                                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{med.name}</h3>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', background: '#f1f5f9', padding: '0.1rem 0.5rem', borderRadius: '0.25rem' }}>
                                                {med.dosage}
                                            </span>
                                            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                {med.description}
                                            </p>
                                        </div>

                                        <div style={{ marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div>
                                                    {promoPercent > 0 ? (
                                                        <>
                                                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                                R$ {promoRetailPrice.toFixed(2)}
                                                            </span>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                <span style={{ textDecoration: 'line-through', marginRight: '0.5rem' }}>
                                                                    R$ {retailPrice.toFixed(2)}
                                                                </span>
                                                                Promoção aplicada
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                Atacado: R$ {promoWholesalePrice.toFixed(2)} (10+ un.)
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                                R$ {retailPrice.toFixed(2)}
                                                            </span>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                Atacado: R$ {wholesalePrice.toFixed(2)} (10+ un.)
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                                        Quantidade
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        defaultValue="1"
                                                        id={`qty-${med.id}`}
                                                        aria-label={`Quantidade para ${med.name}`}
                                                        style={{ width: '90px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleAddToCart(med, 'retail')}
                                                        className="btn btn-primary"
                                                        style={{ width: '100%' }}
                                                    >
                                                        <Plus size={18} /> Varejo
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddToCart(med, 'wholesale')}
                                                        className="btn btn-outline"
                                                        style={{ width: '100%', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                                    >
                                                        <Plus size={18} /> Atacado 10+
                                                    </button>
                                                </div>

                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    Varejo: preco unitario. Atacado: minimo de 10 unidades.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredMedicines.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                            <p>Nenhum medicamento encontrado para os filtros selecionados.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Catalog;
