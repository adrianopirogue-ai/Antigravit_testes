import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey =
    Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const resendFrom = Deno.env.get('RESEND_FROM') ?? 'onboarding@resend.dev';
const adminEmailsEnv = Deno.env.get('ADMIN_EMAILS') ?? '';

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

serve(async (req) => {
    if (req.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (!supabaseUrl || !serviceRoleKey) {
        return jsonResponse({ error: 'Missing Supabase configuration' }, 500);
    }

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) {
        return jsonResponse({ error: 'order_id is required' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
    });

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, total, status, created_at, user_id, order_items(quantity, unit_price, medicines(name, dosage))')
        .eq('id', order_id)
        .single();

    if (orderError || !order) {
        return jsonResponse({ error: orderError?.message ?? 'Order not found' }, 404);
    }

    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name, email, cpf_cnpj, phone1, phone2, cep, address, address_number, address_type, municipio, estado, reference')
        .eq('user_id', order.user_id)
        .single();

    if (customerError || !customer) {
        return jsonResponse({ error: customerError?.message ?? 'Customer not found' }, 404);
    }

    let adminEmails = adminEmailsEnv
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);

    if (!adminEmails.length) {
        const { data: admins, error: adminsError } = await supabase
            .from('admins')
            .select('email')
            .eq('is_active', true);

        if (adminsError) {
            return jsonResponse({ error: adminsError.message }, 500);
        }

        adminEmails = (admins ?? []).map((admin) => admin.email).filter(Boolean);
    }

    if (!adminEmails.length) {
        return jsonResponse({ error: 'No admin emails configured' }, 400);
    }

    const items = (order.order_items ?? []).map((item) => ({
        name: item.medicines?.name ?? 'Produto',
        dosage: item.medicines?.dosage ?? '',
        quantity: item.quantity,
        unit_price: item.unit_price,
    }));

    const itemsHtml = items
        .map(
            (item) =>
                `<li>${item.quantity}x ${item.name} ${item.dosage} - R$ ${Number(item.unit_price).toFixed(2)}</li>`,
        )
        .join('');

    const address = `${customer.address}, ${customer.address_number} (${customer.address_type}) - ${customer.municipio}/${customer.estado} - CEP ${customer.cep}`;
    const phones = [customer.phone1, customer.phone2].filter(Boolean).join(' / ');

    const html = `
        <h2>Novo pedido recebido</h2>
        <p><strong>Pedido:</strong> ${order.id}</p>
        <p><strong>Cliente:</strong> ${customer.name}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>CPF/CNPJ:</strong> ${customer.cpf_cnpj}</p>
        <p><strong>Telefones:</strong> ${phones}</p>
        <p><strong>Endereco:</strong> ${address}</p>
        ${customer.reference ? `<p><strong>Referencia:</strong> ${customer.reference}</p>` : ''}
        <p><strong>Total:</strong> R$ ${Number(order.total).toFixed(2)}</p>
        <h3>Itens</h3>
        <ul>${itemsHtml}</ul>
    `;

    if (!resendApiKey) {
        return jsonResponse({ error: 'RESEND_API_KEY is not configured' }, 500);
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: resendFrom,
            to: adminEmails,
            subject: `Novo pedido ${order.id.slice(0, 8)}`,
            html,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        return jsonResponse({ error: message || 'Failed to send email' }, 500);
    }

    return jsonResponse({ ok: true });
});
