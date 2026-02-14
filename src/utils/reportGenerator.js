import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMedicineTypeLabel } from './medicineTypes';

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR');
};

const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
};

const daysUntil = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = date.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const drawBarChart = (doc, x, y, width, height, data, title) => {
    const maxValue = Math.max(...data.map(item => item.value), 1);
    const chartTop = y + 8;
    const chartHeight = height - 16;
    const chartWidth = width;
    const barWidth = data.length ? chartWidth / data.length : chartWidth;

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(title, x, y + 4);

    doc.setDrawColor(226, 232, 240);
    doc.rect(x, chartTop, chartWidth, chartHeight);

    if (!data.length) {
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text('Sem dados', x + 6, chartTop + chartHeight / 2);
        return;
    }

    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * (chartHeight - 12);
        const barX = x + index * barWidth + 6;
        const barY = chartTop + chartHeight - barHeight - 4;
        const barW = Math.max(6, barWidth - 12);

        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.rect(barX, barY, barW, barHeight, 'F');

        doc.setFontSize(8);
        doc.setTextColor(60);
        doc.text(String(item.value), barX, barY - 2);
        const label = item.label.length > 10 ? `${item.label.slice(0, 10)}...` : item.label;
        doc.text(label, barX, chartTop + chartHeight + 6);
    });
};

export const generateStockReport = (medicines) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 156, 59); // Brasil Mais green
    doc.text('Brasil Mais Distribuidora', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Estoque', 105, 30, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Gerado em: ${currentDate}`, 105, 38, { align: 'center' });

    // Summary Stats
    const lowStockThreshold = 100;
    const expiryWindowDays = 30;
    const totalProducts = medicines.length;
    const totalStock = medicines.reduce((sum, med) => sum + toNumber(med.stock), 0);
    const totalValue = medicines.reduce((sum, med) => sum + (toNumber(med.price) * toNumber(med.stock)), 0);
    const lowStockItems = medicines.filter(med => toNumber(med.stock) < lowStockThreshold).length;
    const expiringSoonItems = medicines.filter((med) => {
        const days = daysUntil(med.expiration_date);
        return days !== null && days >= 0 && days <= expiryWindowDays;
    }).length;

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total de Produtos: ${totalProducts}`, 20, 50);
    doc.text(`Estoque Total: ${totalStock} unidades`, 20, 57);
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2)}`, 20, 64);
    doc.text(`Produtos em Estoque Critico: ${lowStockItems}`, 20, 71);
    doc.text(`Vencendo em ${expiryWindowDays} dias: ${expiringSoonItems}`, 20, 78);

    let cursorY = 86;
    const pageHeight = doc.internal.pageSize.getHeight();
    const ensureSpace = (needed) => {
        if (cursorY + needed > pageHeight - 20) {
            doc.addPage();
            cursorY = 20;
        }
    };

    // Charts
    const statusData = [
        { label: 'Baixo', value: medicines.filter(m => toNumber(m.stock) < lowStockThreshold).length, color: [239, 68, 68] },
        { label: 'Normal', value: medicines.filter(m => toNumber(m.stock) >= lowStockThreshold && toNumber(m.stock) < 500).length, color: [59, 130, 246] },
        { label: 'Alto', value: medicines.filter(m => toNumber(m.stock) >= 500).length, color: [16, 185, 129] }
    ];

    const typeTotals = medicines.reduce((acc, med) => {
        const label = getMedicineTypeLabel(med.type);
        acc[label] = (acc[label] || 0) + toNumber(med.stock);
        return acc;
    }, {});

    const topTypes = Object.entries(typeTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value], idx) => ({
            label,
            value,
            color: [
                [0, 156, 59],
                [0, 119, 255],
                [245, 158, 11],
                [148, 163, 184],
                [124, 58, 237]
            ][idx % 5]
        }));

    ensureSpace(60);
    drawBarChart(doc, 20, cursorY, 80, 50, statusData, 'Status do estoque');
    drawBarChart(doc, 115, cursorY, 80, 50, topTypes, 'Estoque por categoria');
    cursorY += 60;

    // Table
    if (typeof autoTable !== 'function') {
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('Tabela nao disponivel (plugin autoTable nao carregado).', 20, cursorY);
        return doc;
    }

    const tableData = medicines.map(med => {
        const priceValue = toNumber(med.price);
        const wholesaleValue = toNumber(med.wholesale_price);
        const stockValue = toNumber(med.stock);
        return [
            med.name,
            med.dosage,
            getMedicineTypeLabel(med.type),
            stockValue,
            formatDate(med.expiration_date),
            `${toNumber(med.promo_percent).toFixed(0)}%`,
            `R$ ${priceValue.toFixed(2)}`,
            `R$ ${wholesaleValue.toFixed(2)}`,
            `R$ ${(priceValue * stockValue).toFixed(2)}`,
            stockValue >= 500 ? 'Alto' : stockValue >= lowStockThreshold ? 'Normal' : 'Baixo'
        ];
    });

    autoTable(doc, {
        head: [['Produto', 'Dosagem', 'Categoria', 'Qtd', 'Validade', 'Promo', 'Preço Un.', 'Preço Atacado', 'Valor Total', 'Status']],
        body: tableData,
        startY: cursorY,
        styles: {
            fontSize: 7,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [0, 156, 59],
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: {
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'right' },
            7: { halign: 'right' },
            8: { halign: 'right' },
            9: { halign: 'center' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 9) {
                const status = data.cell.raw;
                if (status === 'Baixo') {
                    data.cell.styles.textColor = [220, 38, 38]; // Red
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'Alto') {
                    data.cell.styles.textColor = [16, 185, 129]; // Green
                }
            }
        }
    });

    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 10;
    ensureSpace(60);

    // Suggestions
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Sugestoes de reposicao', 20, cursorY);
    cursorY += 6;

    const lowStockList = medicines.filter(med => toNumber(med.stock) < lowStockThreshold);
    if (lowStockList.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(90);
        doc.text('- Nenhum produto abaixo do limite de estoque.', 20, cursorY);
        cursorY += 6;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(60);
        lowStockList.slice(0, 8).forEach((med) => {
            const suggested = Math.max(0, lowStockThreshold - toNumber(med.stock));
            doc.text(`- Repor ${med.name}: falta ${suggested} un. para atingir ${lowStockThreshold}.`, 20, cursorY);
            cursorY += 5;
        });
        if (lowStockList.length > 8) {
            doc.text(`- ... e mais ${lowStockList.length - 8} produtos.`, 20, cursorY);
            cursorY += 5;
        }
    }

    const expiringList = medicines.filter((med) => {
        const days = daysUntil(med.expiration_date);
        return days !== null && days >= 0 && days <= expiryWindowDays;
    });

    if (expiringList.length > 0) {
        doc.text(`- Produtos vencendo em ate ${expiryWindowDays} dias: aplicar promocao e revisar estoque.`, 20, cursorY);
        cursorY += 5;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc;
};

export const generateCriticalStockReport = (medicines) => {
    const criticalMedicines = medicines.filter(med => toNumber(med.stock) < 100);
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38); // Red
    doc.text('Brasil Mais Distribuidora', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Estoque Crítico', 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    const currentDate = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${currentDate}`, 105, 38, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text(`⚠️ ${criticalMedicines.length} produtos precisam de reposição urgente`, 20, 50);

    // Table
    const tableData = criticalMedicines.map(med => {
        const priceValue = toNumber(med.price);
        const stockValue = toNumber(med.stock);
        return [
            med.name,
            med.dosage,
            stockValue,
            `R$ ${priceValue.toFixed(2)}`,
            stockValue < 50 ? 'CRÍTICO' : 'BAIXO'
        ];
    });

    if (typeof autoTable !== 'function') {
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('Tabela nao disponivel (plugin autoTable nao carregado).', 20, 60);
        return doc;
    }

    autoTable(doc, {
        head: [['Produto', 'Dosagem', 'Qtd Atual', 'Preço', 'Prioridade']],
        body: tableData,
        startY: 60,
        headStyles: {
            fillColor: [220, 38, 38],
            textColor: 255
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 4) {
                if (data.cell.raw === 'CRÍTICO') {
                    data.cell.styles.fillColor = [254, 226, 226];
                    data.cell.styles.textColor = [153, 27, 27];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

    return doc;
};

export const printStockTable = () => {
    window.print();
};
