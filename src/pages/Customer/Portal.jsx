import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User, LogOut, Loader2, CheckCircle } from 'lucide-react';

const createEmptyProfile = () => ({
    name: '',
    email: '',
    cpf_cnpj: '',
    phone1: '',
    phone2: '',
    cep: '',
    address: '',
    address_number: '',
    address_type: 'Casa',
    municipio: '',
    estado: '',
    reference: ''
});

const CustomerPortal = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('login');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerData, setRegisterData] = useState({
        ...createEmptyProfile(),
        password: '',
        confirmPassword: ''
    });
    const [profileData, setProfileData] = useState(createEmptyProfile());
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const baseUrl = import.meta.env.BASE_URL || '/';

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchProfile();
        } else {
            setProfileLoaded(false);
            setProfileData(createEmptyProfile());
        }
    }, [session]);

    const fetchProfile = async () => {
        setError('');
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setProfileData({
                    name: data.name || '',
                    email: data.email || session.user.email || '',
                    cpf_cnpj: data.cpf_cnpj || '',
                    phone1: data.phone1 || '',
                    phone2: data.phone2 || '',
                    cep: data.cep || '',
                    address: data.address || '',
                    address_number: data.address_number || '',
                    address_type: data.address_type || 'Casa',
                    municipio: data.municipio || '',
                    estado: data.estado || '',
                    reference: data.reference || ''
                });
                setProfileLoaded(true);
                return;
            }

            setProfileData((prev) => ({
                ...prev,
                email: session.user.email || ''
            }));
            setProfileLoaded(false);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            setError(error.message || 'Erro ao buscar perfil.');
        }
    };

    const validatePassword = (value) => /^\d{6}$/.test(value);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const identifier = loginIdentifier.trim();
        if (!identifier) {
            setError('Informe email ou CPF/CNPJ.');
            return;
        }

        if (!validatePassword(loginPassword)) {
            setError('A senha deve ter 6 numeros.');
            return;
        }

        try {
            let email = identifier;
            if (!identifier.includes('@')) {
                const { data, error } = await supabase.rpc('get_email_by_cpf', { p_cpf: identifier });
                if (error) throw error;
                if (!data) {
                    setError('CPF/CNPJ nao encontrado.');
                    return;
                }
                email = data;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: loginPassword
            });

            if (error) throw error;
        } catch (error) {
            console.error('Erro no login:', error);
            setError(error.message || 'Erro ao entrar.');
        }
    };

    const validateRegisterFields = () => {
        const required = [
            registerData.name,
            registerData.email,
            registerData.cpf_cnpj,
            registerData.phone1,
            registerData.cep,
            registerData.address,
            registerData.address_number,
            registerData.address_type,
            registerData.municipio,
            registerData.estado
        ];

        if (required.some((value) => !value || !value.toString().trim())) {
            return 'Preencha todos os campos obrigatorios.';
        }

        if (!validatePassword(registerData.password)) {
            return 'A senha deve ter exatamente 6 numeros.';
        }

        if (registerData.password !== registerData.confirmPassword) {
            return 'As senhas nao coincidem.';
        }

        return '';
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateRegisterFields();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);
        try {
            const email = registerData.email.trim();
            const metadata = {
                name: registerData.name.trim(),
                cpf_cnpj: registerData.cpf_cnpj.trim(),
                phone1: registerData.phone1.trim(),
                phone2: registerData.phone2.trim() || null,
                cep: registerData.cep.trim(),
                address: registerData.address.trim(),
                address_number: registerData.address_number.trim(),
                address_type: registerData.address_type.trim(),
                municipio: registerData.municipio.trim(),
                estado: registerData.estado.trim(),
                reference: registerData.reference.trim() || null
            };

            const { data, error } = await supabase.auth.signUp({
                email,
                password: registerData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}${baseUrl}cliente`,
                    data: metadata
                }
            });

            if (error) throw error;

            const userId = data.session?.user?.id ?? data.user?.id ?? null;

            if (data.session && userId) {
                const { error: insertError } = await supabase
                    .from('customers')
                    .upsert([{
                        user_id: userId,
                        email,
                        ...metadata
                    }], { onConflict: 'user_id' });

                if (insertError) throw insertError;

                setSuccess('Cadastro criado com sucesso! Redirecionando para o catálogo...');
                setMode('login');
                setTimeout(() => {
                    window.location.href = `${baseUrl}catalog`;
                }, 1500);
                setRegisterData({
                    ...createEmptyProfile(),
                    password: '',
                    confirmPassword: ''
                });
            } else {
                setSuccess('Cadastro criado. Confirme o email para entrar.');
                setMode('login');
            }
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            setError(error.message || 'Erro ao cadastrar.');
        } finally {
            setSaving(false);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const required = [
            profileData.name,
            profileData.cpf_cnpj,
            profileData.phone1,
            profileData.cep,
            profileData.address,
            profileData.address_number,
            profileData.address_type,
            profileData.municipio,
            profileData.estado
        ];

        if (required.some((value) => !value || !value.toString().trim())) {
            setError('Preencha todos os campos obrigatorios.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                user_id: session.user.id,
                name: profileData.name.trim(),
                email: profileData.email.trim(),
                cpf_cnpj: profileData.cpf_cnpj.trim(),
                phone1: profileData.phone1.trim(),
                phone2: profileData.phone2.trim() || null,
                cep: profileData.cep.trim(),
                address: profileData.address.trim(),
                address_number: profileData.address_number.trim(),
                address_type: profileData.address_type.trim(),
                municipio: profileData.municipio.trim(),
                estado: profileData.estado.trim(),
                reference: profileData.reference.trim() || null
            };

            const { data, error } = await supabase
                .from('customers')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data?.id) {
                const { error: updateError } = await supabase
                    .from('customers')
                    .update(payload)
                    .eq('user_id', session.user.id);

                if (updateError) throw updateError;
                setSuccess('Dados atualizados com sucesso.');
            } else {
                const { error: insertError } = await supabase
                    .from('customers')
                    .insert([payload]);
                if (insertError) throw insertError;
                setSuccess('Cadastro completo!');
                setProfileLoaded(true);
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            setError(error.message || 'Erro ao salvar perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!session) {
        return (
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '640px' }}>
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
                            <User size={40} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Area do Cliente</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Entre ou crie seu cadastro para finalizar pedidos.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <button
                            type="button"
                            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1 }}
                            onClick={() => setMode('login')}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1 }}
                            onClick={() => setMode('register')}
                        >
                            Cadastro
                        </button>
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

                    {success && (
                        <div style={{
                            padding: '1rem',
                            background: '#dcfce7',
                            color: '#166534',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {success}
                        </div>
                    )}

                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                    Email ou CPF/CNPJ
                                </label>
                                <input
                                    type="text"
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="email@exemplo.com ou CPF"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                    Senha (6 numeros)
                                </label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="******"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                Entrar
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <Link to="/cliente/forgot-password" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', textDecoration: 'underline' }}>
                                    Esqueci minha senha
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Nome</label>
                                    <input
                                        type="text"
                                        value={registerData.name}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Email</label>
                                    <input
                                        type="email"
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>CPF/CNPJ</label>
                                    <input
                                        type="text"
                                        value={registerData.cpf_cnpj}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, cpf_cnpj: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Telefone 1</label>
                                    <input
                                        type="text"
                                        value={registerData.phone1}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, phone1: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Telefone 2</label>
                                    <input
                                        type="text"
                                        value={registerData.phone2}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, phone2: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>CEP</label>
                                    <input
                                        type="text"
                                        value={registerData.cep}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, cep: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Endereco</label>
                                    <input
                                        type="text"
                                        value={registerData.address}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, address: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Numero</label>
                                    <input
                                        type="text"
                                        value={registerData.address_number}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, address_number: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Casa ou apartamento</label>
                                    <select
                                        value={registerData.address_type}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, address_type: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)',
                                            background: 'white'
                                        }}
                                    >
                                        <option value="Casa">Casa</option>
                                        <option value="Apartamento">Apartamento</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Municipio</label>
                                    <input
                                        type="text"
                                        value={registerData.municipio}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, municipio: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Estado</label>
                                    <input
                                        type="text"
                                        value={registerData.estado}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, estado: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Referencia</label>
                                    <input
                                        type="text"
                                        value={registerData.reference}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, reference: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                        Senha (6 numeros)
                                    </label>
                                    <input
                                        type="password"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                        Confirmar senha
                                    </label>
                                    <input
                                        type="password"
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Salvando...' : 'Criar cadastro'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '760px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>Area do Cliente</h2>
                        <p style={{ color: 'var(--color-text)' }}>
                            {profileData.name?.trim() || session.user.user_metadata?.name || session.user.email}
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            {session.user.email}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LogOut size={18} /> Sair
                    </button>
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

                {success && (
                    <div style={{
                        padding: '1rem',
                        background: '#dcfce7',
                        color: '#166534',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {success}
                    </div>
                )}

                {!profileLoaded && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                        <CheckCircle size={18} />
                        Complete seu cadastro para finalizar pedidos.
                    </div>
                )}

                <form onSubmit={handleProfileSave} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Nome</label>
                            <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Email</label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                                required
                                readOnly
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    background: '#f8fafc'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>CPF/CNPJ</label>
                            <input
                                type="text"
                                value={profileData.cpf_cnpj}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, cpf_cnpj: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Telefone 1</label>
                            <input
                                type="text"
                                value={profileData.phone1}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, phone1: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Telefone 2</label>
                            <input
                                type="text"
                                value={profileData.phone2}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, phone2: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>CEP</label>
                            <input
                                type="text"
                                value={profileData.cep}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, cep: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Endereco</label>
                            <input
                                type="text"
                                value={profileData.address}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Numero</label>
                            <input
                                type="text"
                                value={profileData.address_number}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, address_number: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Casa ou apartamento</label>
                            <select
                                value={profileData.address_type}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, address_type: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    background: 'white'
                                }}
                            >
                                <option value="Casa">Casa</option>
                                <option value="Apartamento">Apartamento</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Municipio</label>
                            <input
                                type="text"
                                value={profileData.municipio}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, municipio: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Estado</label>
                            <input
                                type="text"
                                value={profileData.estado}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, estado: e.target.value }))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Referencia</label>
                            <input
                                type="text"
                                value={profileData.reference}
                                onChange={(e) => setProfileData((prev) => ({ ...prev, reference: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar dados'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CustomerPortal;
