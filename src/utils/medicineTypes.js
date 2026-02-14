export const MEDICINE_TYPE_LABELS = {
    'Analgesic': 'Analgésico',
    'Antibiotic': 'Antibiótico',
    'Antiallergic': 'Antialérgico',
    'Gastric': 'Gástrico',
    'Anti-inflammatory': 'Anti-inflamatório',
    'Controlled': 'Controlado',
    'Cardiovascular': 'Cardiovascular',
    'Supplement': 'Suplemento'
};

export const getMedicineTypeLabel = (type) => {
    if (!type) return '';
    return MEDICINE_TYPE_LABELS[type] || type;
};
