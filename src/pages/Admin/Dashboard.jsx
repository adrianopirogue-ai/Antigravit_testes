import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Package, Users, Settings, LogOut, Loader2, FileText, Printer, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { generateStockReport, generateCriticalStockReport } from '../../utils/reportGenerator';

const AdminDashboard = () => {
    console.log('📊 Renderizando AdminDashboard');
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [medicines, setMedicines] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        // Verificar sessão atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Escutar mudanças de autenticação
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchMedicines();
        }
    }, [session]);

    const fetchMedicines = async () => {
        try {
            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .order('name');

            if (error) throw error;

            setMedicines(data || []);
        } catch (error) {
            console.error('Erro ao buscar medicamentos:', error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Sessão será atualizada automaticamente via onAuthStateChange
        } catch (error) {
            console.error('Erro no login:', error);
            setLoginError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const handleDownloadReport = () => {
        const doc = generateStockReport(medicines);
        doc.save(`Estoque_BrasilMais_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    };

    const handleDownloadCriticalReport = () => {
        const doc = generateCriticalStockReport(medicines);
        doc.save(`Estoque_Critico_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    const calculateStats = () => {
        const totalProducts = medicines.length;
        const totalStock = medicines.reduce((sum, med) => sum + med.stock, 0);
        const totalValue = medicines.reduce((sum, med) => sum + (med.price * med.stock), 0);
        const criticalStock = medicines.filter(med => med.stock < 100).length;

        return { totalProducts, totalStock, totalValue, criticalStock };
    };

    const stats = calculateStats();

    // Loading state
    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    // Login Form
    if (!session) {
        return (
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                            <LayoutDashboard size={40} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Área Administrativa</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Brasil Mais Distribuidora</p>
                    </div>

                    {loginError && (
                        <div style={{
                            padding: '1rem',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {loginError}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoggingIn}
                            style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}
                        >
                            {isLoggingIn ? (
                                <>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/admin/forgot-password" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', textDecoration: 'underline' }}>
                            Esqueci minha senha
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="container" style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            {/* Sidebar */}
            <aside className="glass-card fade-in" style={{ width: '250px', padding: '1.5rem', height: 'fit-content' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        <LayoutDashboard size={24} />
                        <span>Painel Admin</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {session.user.email}
                    </p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ justifyContent: 'flex-start', width: '100%' }}>
                        <Package size={18} /> Estoque
                    </button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}>
                        <Users size={18} /> Clientes
                    </button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}>
                        <Settings size={18} /> Configurações
                    </button>
                </nav>

                <div style={{ marginTop: '4rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', color: '#dc2626', borderColor: '#dc2626' }}>
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, minWidth: '300px' }} className="slide-in">
                {/* Statistics Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Total de Produtos</span>
                            <Package size={20} color="var(--color-primary)" />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>{stats.totalProducts}</div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Unidades em Estoque</span>
                            <TrendingDown size={20} color="#3b82f6" />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>{stats.totalStock.toLocaleString()}</div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Valor Total</span>
                            <DollarSign size={20} color="#10b981" />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Estoque Crítico</span>
                            <AlertTriangle size={20} color="#ef4444" />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>{stats.criticalStock}</div>
                    </div>
                </div>

                {/* Report Section */}
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Relatórios</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button onClick={handleDownloadReport} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
                                <FileText size={18} /> Baixar Relatório Completo
                            </button>
                            <button onClick={handleDownloadCriticalReport} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
                                <AlertTriangle size={18} /> Produtos Críticos
                            </button>
                            <button onClick={handlePrint} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
                                <Printer size={18} /> Imprimir
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stock Table */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>Gestão de Estoque</h2>
                        <span className="badge badge-info">{medicines.length} produtos</span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={{ padding: '1rem' }}>Produto</th>
                                    <th style={{ padding: '1rem' }}>Tipo</th>
                                    <th style={{ padding: '1rem' }}>Qtd.</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.map(med => (
                                    <tr key={med.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                                            {med.name} <span style={{ fontSize: '0.8rem', color: 'gray' }}>({med.dosage})</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{med.type}</td>
                                        <td style={{ padding: '1rem' }}>{med.stock}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${med.stock >= 500 ? 'badge-success' : med.stock >= 100 ? 'badge-info' : 'badge-warning'}`}>
                                                {med.stock >= 500 ? 'Alto' : med.stock >= 100 ? 'Normal' : 'Baixo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
