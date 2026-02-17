import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Package, Users, Settings, LogOut, Loader2, FileText, Printer, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { generateStockReport, generateCriticalStockReport } from '../../utils/reportGenerator';
import { getMedicineTypeLabel } from '../../utils/medicineTypes';

const AdminDashboard = () => {
    console.log('📊 Renderizando AdminDashboard');
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [medicines, setMedicines] = useState([]);
    const [activeTab, setActiveTab] = useState('stock');
    const [customers, setCustomers] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [customersError, setCustomersError] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('all'); // all, critical, expiring
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [lowStockThreshold, setLowStockThreshold] = useState(100);
    const [expiryWindowDays, setExpiryWindowDays] = useState(30);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');
    const createEmptyForm = () => ({
        name: '',
        dosage: '',
        type: '',
        stock: '',
        price: '',
        wholesale_price: '',
        description: '',
        image_url: '',
        expiration_date: '',
        requires_prescription: false,
    });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [formData, setFormData] = useState(createEmptyForm());
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);
    const imageBucket = 'medicine-images';
    const maxImageSizeBytes = 5 * 1024 * 1024;
    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--color-border)',
        fontSize: '0.95rem'
    };
    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '600'
    };

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

    useEffect(() => {
        if (session && activeTab === 'customers') {
            fetchCustomers();
        }
    }, [session, activeTab]);

    useEffect(() => {
        if (session && activeTab === 'orders') {
            fetchOrders();
        }
    }, [session, activeTab]);

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

    const fetchCustomers = async () => {
        setCustomersError('');
        setCustomersLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('id, name, email, cpf_cnpj, phone1, municipio, estado, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setCustomers(data || []);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            const message = error.message || 'Erro ao buscar clientes.';
            if (message.toLowerCase().includes('permission')) {
                setCustomersError('Sem permissao para listar clientes. Verifique se o email esta cadastrado na tabela admins e se as politicas foram aplicadas.');
            } else {
                setCustomersError(message);
            }
        } finally {
            setCustomersLoading(false);
        }
    };

    const fetchOrders = async () => {
        setOrdersError('');
        setOrdersLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    total, 
                    status, 
                    created_at,
                    user_id,
                    customers (name, email, phone1)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            setOrdersError(error.message || 'Erro ao buscar pedidos.');
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleConfirmOrder = async (orderId) => {
        if (!window.confirm('Deseja confirmar esta venda e finalizar a retirada do estoque?')) return;

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', orderId);

            if (error) throw error;
            await fetchOrders();
        } catch (error) {
            console.error('Erro ao confirmar pedido:', error);
            alert('Erro ao confirmar pedido.');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Deseja cancelar este pedido?')) return;

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);

            if (error) throw error;
            await fetchOrders();
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            alert('Erro ao cancelar pedido.');
        }
    };

    const revokePreview = (url) => {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    };

    const clearFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetImageState = (previewUrl = '') => {
        revokePreview(imagePreview);
        clearFileInput();
        setImageFile(null);
        setImagePreview(previewUrl || '');
    };

    const openAddForm = () => {
        setEditingMedicine(null);
        setFormError('');
        setFormData(createEmptyForm());
        resetImageState('');
        setIsFormOpen(true);
    };

    const openEditForm = (medicine) => {
        setEditingMedicine(medicine);
        setFormError('');
        setFormData({
            name: medicine.name || '',
            dosage: medicine.dosage || '',
            type: medicine.type || '',
            stock: medicine.stock ?? '',
            price: medicine.price ?? '',
            wholesale_price: medicine.wholesale_price ?? '',
            description: medicine.description || '',
            image_url: medicine.image_url || '',
            expiration_date: medicine.expiration_date || '',
            requires_prescription: !!medicine.requires_prescription,
        });
        resetImageState(medicine.image_url || '');
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingMedicine(null);
        setFormError('');
        resetImageState('');
    };

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (event) => {
        setFormError('');
        const file = event.target.files && event.target.files[0];
        if (!file) {
            resetImageState(editingMedicine?.image_url || formData.image_url || '');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setFormError('Selecione um arquivo de imagem valido.');
            event.target.value = '';
            return;
        }

        if (file.size > maxImageSizeBytes) {
            setFormError('Imagem muito grande. Maximo 5MB.');
            event.target.value = '';
            return;
        }

        revokePreview(imagePreview);
        const objectUrl = URL.createObjectURL(file);
        setImageFile(file);
        setImagePreview(objectUrl);
    };

    const toNumber = (value) => Number(String(value).replace(',', '.'));

    const handleSaveMedicine = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name.trim() || !formData.dosage.trim() || !formData.type.trim()) {
            setFormError('Preencha nome, dosagem e tipo.');
            return;
        }

        if (formData.price === '' || formData.wholesale_price === '' || formData.stock === '') {
            setFormError('Preco, preco atacado e estoque sao obrigatorios.');
            return;
        }

        const priceValue = toNumber(formData.price);
        const wholesaleValue = toNumber(formData.wholesale_price);
        const stockValue = toNumber(formData.stock);

        if (!Number.isFinite(priceValue) || priceValue < 0) {
            setFormError('Preco invalido.');
            return;
        }

        if (!Number.isFinite(wholesaleValue) || wholesaleValue < 0) {
            setFormError('Preco atacado invalido.');
            return;
        }

        if (!Number.isFinite(stockValue) || stockValue < 0) {
            setFormError('Estoque invalido.');
            return;
        }

        let imageUrl = formData.image_url.trim() ? formData.image_url.trim() : null;

        setIsSaving(true);
        try {
            if (imageFile) {
                const fileExt = imageFile.name.includes('.') ? imageFile.name.split('.').pop() : 'jpg';
                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const folder = session?.user?.id || 'public';
                const filePath = `${folder}/${fileName}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from(imageBucket)
                    .upload(filePath, imageFile, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: imageFile.type
                    });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from(imageBucket)
                    .getPublicUrl(filePath);

                if (!publicUrlData?.publicUrl) {
                    throw new Error('Nao foi possivel obter a URL da imagem.');
                }

                imageUrl = publicUrlData.publicUrl;
            }

            const payload = {
                name: formData.name.trim(),
                dosage: formData.dosage.trim(),
                type: formData.type.trim(),
                stock: Math.trunc(stockValue),
                price: priceValue,
                wholesale_price: wholesaleValue,
                description: formData.description.trim() ? formData.description.trim() : null,
                image_url: imageUrl,
                expiration_date: formData.expiration_date ? formData.expiration_date : null,
                requires_prescription: !!formData.requires_prescription,
            };

            let error;
            if (editingMedicine) {
                ({ error } = await supabase
                    .from('medicines')
                    .update(payload)
                    .eq('id', editingMedicine.id));
            } else {
                ({ error } = await supabase
                    .from('medicines')
                    .insert([payload]));
            }

            if (error) throw error;

            await fetchMedicines();
            closeForm();
        } catch (error) {
            console.error('Erro ao salvar medicamento:', error);
            let message = error.message || 'Erro ao salvar medicamento.';
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('bucket') || lowerMessage.includes('storage')) {
                message = `${message} Verifique o bucket ${imageBucket} e as politicas no Supabase.`;
            }
            setFormError(message);
        } finally {
            setIsSaving(false);
        }
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);

        try {
            console.log('Tentando login com Supabase Auth...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Erro retornado pelo Supabase:', error);
                throw error;
            }

            console.log('Login bem-sucedido!');
            // Sessão será atualizada automaticamente via onAuthStateChange
        } catch (error) {
            console.error('Catch error no login:', error);
            let message = error.message;

            if (message === 'Failed to fetch') {
                message = 'Erro de conexão (Failed to fetch). Isso geralmente ocorre por bloqueio de VPN, Firewall ou se as chaves do Supabase não foram configuradas no Vercel.';
            }

            setLoginError(message || 'Erro ao fazer login. Verifique suas credenciais.');
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
        try {
            const doc = generateStockReport(medicines);
            doc.save(`Estoque_BrasilMais_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
        } catch (error) {
            console.error('Erro ao gerar relatório completo:', error);
            alert('Nao foi possivel gerar o relatorio. Verifique os dados do estoque e tente novamente.');
        }
    };

    const handleDownloadCriticalReport = () => {
        try {
            const doc = generateCriticalStockReport(medicines);
            doc.save(`Estoque_Critico_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
        } catch (error) {
            console.error('Erro ao gerar relatório crítico:', error);
            alert('Nao foi possivel gerar o relatorio crítico. Verifique os dados do estoque e tente novamente.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('pt-BR');
    };

    const getDaysUntilExpiration = (value) => {
        if (!value) return null;
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = date.getTime() - today.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };

    const handleAdjustStock = async (medicine, delta) => {
        const nextStock = Math.max(0, (medicine.stock ?? 0) + delta);
        try {
            const { error } = await supabase
                .from('medicines')
                .update({ stock: nextStock })
                .eq('id', medicine.id);

            if (error) throw error;
            await fetchMedicines();
        } catch (error) {
            console.error('Erro ao ajustar estoque:', error);
            alert(error.message || 'Erro ao ajustar estoque.');
        }
    };

    const handleDeleteMedicine = async (medicine) => {
        const confirmed = window.confirm(`Remover o produto "${medicine.name}"? Essa ação não pode ser desfeita.`);
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('medicines')
                .delete()
                .eq('id', medicine.id);

            if (error) throw error;
            await fetchMedicines();
        } catch (error) {
            console.error('Erro ao remover produto:', error);
            alert(error.message || 'Erro ao remover produto.');
        }
    };

    const handleApplyPromo = async (medicine, percent = 10) => {
        try {
            const { error } = await supabase
                .from('medicines')
                .update({ promo_percent: percent })
                .eq('id', medicine.id);

            if (error) throw error;
            await fetchMedicines();
        } catch (error) {
            console.error('Erro ao aplicar promoÃ§Ã£o:', error);
            alert(error.message || 'Erro ao aplicar promoÃ§Ã£o.');
        }
    };

    const handleRemovePromo = async (medicine) => {
        try {
            const { error } = await supabase
                .from('medicines')
                .update({ promo_percent: 0 })
                .eq('id', medicine.id);

            if (error) throw error;
            await fetchMedicines();
        } catch (error) {
            console.error('Erro ao remover promoÃ§Ã£o:', error);
            alert(error.message || 'Erro ao remover promoÃ§Ã£o.');
        }
    };

    const calculateStats = () => {
        const totalProducts = medicines.length;
        const totalStock = medicines.reduce((sum, med) => sum + med.stock, 0);
        const totalValue = medicines.reduce((sum, med) => sum + (med.price * med.stock), 0);
        const criticalStock = medicines.filter(med => med.stock < lowStockThreshold).length;
        const expiringSoon = medicines.filter((med) => {
            const days = getDaysUntilExpiration(med.expiration_date);
            return days !== null && days >= 0 && days <= expiryWindowDays;
        }).length;

        return { totalProducts, totalStock, totalValue, criticalStock, expiringSoon };
    };

    const stats = calculateStats();

    const expiringSoon = medicines
        .map((med) => {
            const days = getDaysUntilExpiration(med.expiration_date);
            return { ...med, daysUntil: days };
        })
        .filter((med) => med.daysUntil !== null && med.daysUntil >= 0 && med.daysUntil <= expiryWindowDays)
        .sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));

    const lowStockItems = medicines.filter((med) => med.stock < lowStockThreshold);

    const filteredCustomers = customers.filter((customer) => {
        const term = customerSearch.trim().toLowerCase();
        if (!term) return true;

        return [
            customer.name,
            customer.email,
            customer.cpf_cnpj,
            customer.phone1,
            customer.municipio,
            customer.estado
        ]
            .filter(Boolean)
            .some((value) => value.toString().toLowerCase().includes(term));
    });
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
                            fontSize: '0.9rem',
                            border: '1px solid #f87171',
                            textAlign: 'left'
                        }}>
                            <strong>Erro:</strong> {loginError}
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                                Dica: Verifique se o VPN do seu navegador está desligado.
                            </div>
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
                    <button
                        className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                        onClick={() => setActiveTab('stock')}
                    >
                        <Package size={18} /> Estoque
                    </button>
                    <button
                        className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                        onClick={() => setActiveTab('customers')}
                    >
                        <Users size={18} /> Clientes
                    </button>
                    <button
                        className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                        onClick={() => setActiveTab('orders')}
                    >
                        <DollarSign size={18} /> Vendas
                    </button>
                    <button
                        className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                        onClick={() => setActiveTab('settings')}
                    >
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
                {activeTab === 'stock' && (
                    <>
                        {/* Statistics Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <div
                                className="glass-card"
                                style={{
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    border: stockFilter === 'all' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setStockFilter('all')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Total de Produtos</span>
                                    <Package size={20} color="var(--color-primary)" />
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>{stats.totalProducts}</div>
                            </div>

                            <div className="glass-card" style={{ padding: '1.5rem', opacity: 0.7 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Unidades em Estoque</span>
                                    <TrendingDown size={20} color="#3b82f6" />
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>{stats.totalStock.toLocaleString()}</div>
                            </div>

                            <div className="glass-card" style={{ padding: '1.5rem', opacity: 0.7 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Valor Total</span>
                                    <DollarSign size={20} color="#10b981" />
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>

                            <div
                                className="glass-card"
                                style={{
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    border: stockFilter === 'critical' ? '2px solid #ef4444' : '1px solid var(--color-border)',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setStockFilter('critical')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Estoque Crítico</span>
                                    <AlertTriangle size={20} color="#ef4444" />
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>{stats.criticalStock}</div>
                            </div>
                            <div
                                className="glass-card"
                                style={{
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    border: stockFilter === 'expiring' ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setStockFilter('expiring')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Vencendo em {expiryWindowDays} dias</span>
                                    <AlertTriangle size={20} color="#f59e0b" />
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>{stats.expiringSoon}</div>
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

                        {/* Expiring Soon */}
                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Próximos do vencimento ({expiryWindowDays} dias)</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        Produtos que vencem em até {expiryWindowDays} dias.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={fetchMedicines}
                                >
                                    Atualizar lista
                                </button>
                            </div>

                            {expiringSoon.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Nenhum produto vencendo em breve.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {expiringSoon.map((med) => (
                                        <div key={med.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '0.75rem',
                                            gap: '1rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <div>
                                                <strong>{med.name}</strong>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    Vence em {med.daysUntil} dias - {formatDate(med.expiration_date)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {(med.promo_percent ?? 0) > 0 ? (
                                                    <>
                                                        <span className="badge badge-success">Promoção {med.promo_percent}%</span>
                                                        <button type="button" className="btn btn-outline" onClick={() => handleRemovePromo(med)}>
                                                            Remover promo
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button type="button" className="btn btn-primary" onClick={() => handleApplyPromo(med, 10)}>
                                                        Aplicar -10%
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Low Stock */}
                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Estoque baixo (abaixo de {lowStockThreshold})</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        Produtos que precisam de reposição.
                                    </p>
                                </div>
                                <button type="button" className="btn btn-outline" onClick={fetchMedicines}>
                                    Atualizar lista
                                </button>
                            </div>

                            {lowStockItems.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Nenhum produto com estoque baixo.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {lowStockItems.map((med) => (
                                        <div key={med.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '0.75rem',
                                            gap: '1rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <div>
                                                <strong>{med.name}</strong>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    Estoque atual: {med.stock}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <button type="button" className="btn btn-outline" onClick={() => handleAdjustStock(med, 10)}>
                                                    +10
                                                </button>
                                                <button type="button" className="btn btn-outline" onClick={() => handleAdjustStock(med, 50)}>
                                                    +50
                                                </button>
                                                <button type="button" className="btn btn-primary" onClick={() => openEditForm(med)}>
                                                    Editar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stock Table */}
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h2>Gestão de Estoque</h2>
                                    {stockFilter !== 'all' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                Filtrando por: <strong>{
                                                    stockFilter === 'critical' ? 'Estoque Crítico' : 'Vencendo em breve'
                                                }</strong>
                                            </span>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}
                                                onClick={() => setStockFilter('all')}
                                            >
                                                Limpar filtro
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={openAddForm} className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                                        Adicionar Produto
                                    </button>
                                    <span className="badge badge-info">{medicines.length} produtos</span>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                            <th style={{ padding: '1rem' }}>Produto</th>
                                            <th style={{ padding: '1rem' }}>Tipo</th>
                                            <th style={{ padding: '1rem' }}>Qtd.</th>
                                            <th style={{ padding: '1rem' }}>Validade</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem' }}>Promoção</th>
                                            <th style={{ padding: '1rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicines
                                            .filter(med => {
                                                if (stockFilter === 'all') return true;
                                                if (stockFilter === 'critical') return med.stock < lowStockThreshold;
                                                if (stockFilter === 'expiring') {
                                                    const days = getDaysUntilExpiration(med.expiration_date);
                                                    return days !== null && days <= expiryWindowDays;
                                                }
                                                return true;
                                            })
                                            .map(med => {
                                                const promoPercent = Number(med.promo_percent || 0);
                                                const daysUntil = getDaysUntilExpiration(med.expiration_date);

                                                return (
                                                    <tr key={med.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                                                            {med.name} <span style={{ fontSize: '0.8rem', color: 'gray' }}>({med.dosage})</span>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>{getMedicineTypeLabel(med.type)}</td>
                                                        <td style={{ padding: '1rem' }}>{med.stock}</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {med.expiration_date ? (
                                                                <div>
                                                                    <div>{formatDate(med.expiration_date)}</div>
                                                                    {daysUntil !== null && (
                                                                        <div style={{ fontSize: '0.75rem', color: daysUntil <= expiryWindowDays ? '#f59e0b' : 'var(--color-text-muted)' }}>
                                                                            {daysUntil < 0 ? `Vencido há ${Math.abs(daysUntil)} dias` : `Faltam ${daysUntil} dias`}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span className={`badge ${med.stock >= 500 ? 'badge-success' : med.stock >= lowStockThreshold ? 'badge-info' : 'badge-warning'}`}>
                                                                {med.stock >= 500 ? 'Alto' : med.stock >= lowStockThreshold ? 'Normal' : 'Baixo'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            {promoPercent > 0 ? (
                                                                <span className="badge badge-success">{promoPercent}%</span>
                                                            ) : (
                                                                <span className="badge badge-info">-</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditForm(med)}
                                                                    className="btn btn-outline"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAdjustStock(med, 10)}
                                                                    className="btn btn-outline"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                >
                                                                    +10
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAdjustStock(med, -10)}
                                                                    className="btn btn-outline"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                >
                                                                    -10
                                                                </button>
                                                                {promoPercent > 0 ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemovePromo(med)}
                                                                        className="btn btn-outline"
                                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                    >
                                                                        Remover Promo
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleApplyPromo(med, 10)}
                                                                        className="btn btn-primary"
                                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                    >
                                                                        Promo -10%
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteMedicine(med)}
                                                                    className="btn btn-outline"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#dc2626' }}
                                                                >
                                                                    Remover
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
                {activeTab === 'customers' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <div>
                                <h2>Clientes Cadastrados</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    {customers.length} clientes registrados.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    placeholder="Buscar por nome, email, CPF..."
                                    style={{
                                        padding: '0.65rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        minWidth: '220px'
                                    }}
                                />
                                <button type="button" className="btn btn-outline" onClick={fetchCustomers}>
                                    Atualizar
                                </button>
                            </div>
                        </div>

                        {customersError && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                {customersError}
                            </div>
                        )}

                        {customersLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                            <th style={{ padding: '0.85rem' }}>Nome</th>
                                            <th style={{ padding: '0.85rem' }}>Email</th>
                                            <th style={{ padding: '0.85rem' }}>CPF/CNPJ</th>
                                            <th style={{ padding: '0.85rem' }}>Telefone</th>
                                            <th style={{ padding: '0.85rem' }}>Cidade/UF</th>
                                            <th style={{ padding: '0.85rem' }}>Cadastro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCustomers.map((customer) => (
                                            <tr key={customer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '0.85rem', fontWeight: '600' }}>{customer.name}</td>
                                                <td style={{ padding: '0.85rem' }}>{customer.email}</td>
                                                <td style={{ padding: '0.85rem' }}>{customer.cpf_cnpj}</td>
                                                <td style={{ padding: '0.85rem' }}>{customer.phone1}</td>
                                                <td style={{ padding: '0.85rem' }}>{customer.municipio}/{customer.estado}</td>
                                                <td style={{ padding: '0.85rem' }}>
                                                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString('pt-BR') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {!filteredCustomers.length && (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                    Nenhum cliente encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'orders' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <div>
                                <h2>Gestão de Vendas</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    {orders.length} pedidos registrados.
                                </p>
                            </div>
                            <button type="button" className="btn btn-outline" onClick={fetchOrders}>
                                Atualizar lista
                            </button>
                        </div>

                        {ordersError && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                {ordersError}
                            </div>
                        )}

                        {ordersLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                            <th style={{ padding: '0.85rem' }}>ID Pedido</th>
                                            <th style={{ padding: '0.85rem' }}>Cliente</th>
                                            <th style={{ padding: '0.85rem' }}>Data</th>
                                            <th style={{ padding: '0.85rem' }}>Total</th>
                                            <th style={{ padding: '0.85rem' }}>Status</th>
                                            <th style={{ padding: '0.85rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '0.85rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    #{order.id.slice(0, 8)}
                                                </td>
                                                <td style={{ padding: '0.85rem' }}>
                                                    <div style={{ fontWeight: '600' }}>{order.customers?.name || 'Cliente não identificado'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{order.customers?.email}</div>
                                                </td>
                                                <td style={{ padding: '0.85rem' }}>
                                                    {new Date(order.created_at).toLocaleString('pt-BR')}
                                                </td>
                                                <td style={{ padding: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                    R$ {Number(order.total).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '0.85rem' }}>
                                                    <span className={`badge ${order.status === 'completed' ? 'badge-success' :
                                                        order.status === 'pending' ? 'badge-info' :
                                                            'badge-warning'
                                                        }`}>
                                                        {order.status === 'completed' ? 'Concluído' :
                                                            order.status === 'pending' ? 'Pendente' :
                                                                order.status === 'cancelled' ? 'Cancelado' : order.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.85rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        {order.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleConfirmOrder(order.id)}
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                                                >
                                                                    Confirmar Venda
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelOrder(order.id)}
                                                                    className="btn btn-outline"
                                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#dc2626' }}
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!orders.length && (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                    Nenhum pedido encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Configurações de Estoque</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            Ajuste parâmetros usados para alertas e validações internas.
                        </p>

                        <div style={{ display: 'grid', gap: '1rem', maxWidth: '420px' }}>
                            <div>
                                <label style={labelStyle}>Limite de estoque baixo</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={lowStockThreshold}
                                    onChange={(e) => setLowStockThreshold(Number(e.target.value) || 0)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Dias para alerta de vencimento</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={expiryWindowDays}
                                    onChange={(e) => setExpiryWindowDays(Number(e.target.value) || 0)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Esses valores afetam as listas de estoque baixo e produtos próximos ao vencimento.
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {isFormOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    zIndex: 50
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '760px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                {editingMedicine ? 'Editar Produto' : 'Adicionar Produto'}
                            </h3>
                            <button type="button" onClick={closeForm} className="btn btn-outline" style={{ padding: '0.5rem 0.75rem' }}>
                                Fechar
                            </button>
                        </div>

                        {formError && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSaveMedicine} style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Nome</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleFormChange('name', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Dosagem</label>
                                    <input
                                        type="text"
                                        value={formData.dosage}
                                        onChange={(e) => handleFormChange('dosage', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Tipo</label>
                                    <input
                                        type="text"
                                        value={formData.type}
                                        onChange={(e) => handleFormChange('type', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Estoque</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={formData.stock}
                                        onChange={(e) => handleFormChange('stock', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Preco</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => handleFormChange('price', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Preco Atacado</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.wholesale_price}
                                        onChange={(e) => handleFormChange('wholesale_price', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Validade</label>
                                    <input
                                        type="date"
                                        value={formData.expiration_date || ''}
                                        onChange={(e) => handleFormChange('expiration_date', e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Imagem local</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={inputStyle}
                                    />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                                        JPG/PNG ate 5MB. Se selecionar arquivo, ele substitui a URL.
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>URL da Imagem (opcional)</label>
                                    <input
                                        type="url"
                                        value={formData.image_url}
                                        onChange={(e) => {
                                            handleFormChange('image_url', e.target.value);
                                            if (!imageFile) {
                                                setImagePreview(e.target.value);
                                            }
                                        }}
                                        style={inputStyle}
                                        placeholder="https://"
                                    />
                                </div>
                            </div>

                            {imagePreview && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview da imagem"
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            objectFit: 'cover',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                    {imageFile && (
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => resetImageState(formData.image_url || '')}
                                        >
                                            Remover imagem local
                                        </button>
                                    )}
                                </div>
                            )}

                            <div>
                                <label style={labelStyle}>Descricao</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                    style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                                />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.requires_prescription}
                                    onChange={(e) => handleFormChange('requires_prescription', e.target.checked)}
                                />
                                Requer receita
                            </label>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-outline" onClick={closeForm}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                    {isSaving ? 'Salvando...' : editingMedicine ? 'Salvar' : 'Adicionar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
