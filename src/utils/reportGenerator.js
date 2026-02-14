import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    const totalProducts = medicines.length;
    const totalStock = medicines.reduce((sum, med) => sum + med.stock, 0);
    const totalValue = medicines.reduce((sum, med) => sum + (med.price * med.stock), 0);
    const lowStockItems = medicines.filter(med => med.stock < 100).length;

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total de Produtos: ${totalProducts}`, 20, 50);
    doc.text(`Estoque Total: ${totalStock} unidades`, 20, 57);
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2)}`, 20, 64);
    doc.text(`Produtos em Estoque Crítico: ${lowStockItems}`, 20, 71);

    // Table
    const tableData = medicines.map(med => [
        med.name,
        med.dosage,
        med.type,
        med.stock,
        `R$ ${med.price.toFixed(2)}`,
        `R$ ${(med.price * med.stock).toFixed(2)}`,
        med.stock >= 500 ? 'Alto' : med.stock >= 100 ? 'Normal' : 'Baixo'
    ]);

    doc.autoTable({
        head: [['Produto', 'Dosagem', 'Categoria', 'Qtd', 'Preço Un.', 'Valor Total', 'Status']],
        body: tableData,
        startY: 80,
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [0, 156, 59],
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: {
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'center' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 6) {
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
    const criticalMedicines = medicines.filter(med => med.stock < 100);
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
    const tableData = criticalMedicines.map(med => [
        med.name,
        med.dosage,
        med.stock,
        `R$ ${med.price.toFixed(2)}`,
        med.stock < 50 ? 'CRÍTICO' : 'BAIXO'
    ]);

    doc.autoTable({
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
