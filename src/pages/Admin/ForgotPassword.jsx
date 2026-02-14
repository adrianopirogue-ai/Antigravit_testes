import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/Antigravit_testes/admin/reset-password`,
            });

            if (error) throw error;

            setEmailSent(true);
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            setError(error.message || 'Erro ao enviar email de recuperação.');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                    }}>
                        <CheckCircle size={40} color="white" />
                    </div>

                    <h2 style={{ fontSize: '1.75rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                        Email Enviado!
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                        Verifique sua caixa de entrada em <strong>{email}</strong> e siga as instruções para redefinir sua senha.
                    </p>

                    <Link to="/admin" className="btn btn-primary" style={{ width: '100%' }}>
                        Voltar ao Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                    }}>
                        <Mail size={40} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                        Esqueceu a Senha?
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Enviaremos instruções para redefinir sua senha
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        background: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                            Email
                        </label>
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

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Mail size={20} />
                                Enviar Link de Recuperação
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} />
                        Voltar ao Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
