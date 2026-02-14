import React, { useState } from 'react';
import { medicines } from '../../data/medicines';
import { LayoutDashboard, Package, Users, Settings, LogOut } from 'lucide-react';

const AdminDashboard = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin') {
            setIsLoggedIn(true);
        } else {
            alert('Credenciais inválidas! (admin/admin)');
        }
    };

    if (!isLoggedIn) {
        return (
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.75rem', color: 'var(--color-primary)' }}>Área Restrita</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Brasil Mais Logística</p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Usuário</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                placeholder="admin"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                placeholder="admin"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="container" style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>

            {/* Sidebar */}
            <aside className="glass-card" style={{ width: '250px', padding: '1.5rem', height: 'fit-content' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    <LayoutDashboard size={24} />
                    <span>Painel Admin</span>
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
                    <button onClick={() => setIsLoggedIn(false)} className="btn btn-outline" style={{ width: '100%', color: '#dc2626', borderColor: '#dc2626' }}>
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, minWidth: '300px' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Gestão de Estoque</h2>

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
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{med.name} <span style={{ fontSize: '0.8rem', color: 'gray' }}>({med.dosage})</span></td>
                                        <td style={{ padding: '1rem' }}>{med.type}</td>
                                        <td style={{ padding: '1rem' }}>{med.stock}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.875rem',
                                                background: med.stock > 500 ? '#dcfce7' : '#fee2e2',
                                                color: med.stock > 500 ? '#166534' : '#991b1b'
                                            }}>
                                                {med.stock > 500 ? 'Regular' : 'Baixo'}
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
