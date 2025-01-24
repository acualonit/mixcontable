// Tipos de documentos estandarizados para toda la aplicación
export const DOCUMENT_TYPES = {
  FACTURA_AFECTA: {
    id: 'factura_afecta',
    label: 'Factura Afecta a IVA',
    hasIVA: true
  },
  FACTURA_EXENTA: {
    id: 'factura_exenta',
    label: 'Factura Exenta a IVA',
    hasIVA: false
  },
  BOLETA_AFECTA: {
    id: 'boleta_afecta',
    label: 'Boleta Afecta IVA',
    hasIVA: true
  },
  BOLETA_EXENTA: {
    id: 'boleta_exenta',
    label: 'Boleta Exenta a IVA',
    hasIVA: false
  },
  BOLETA_HONORARIOS: {
    id: 'boleta_honorarios',
    label: 'Boleta de Honorarios',
    hasIVA: false
  },
  VOUCHER_CREDITO: {
    id: 'voucher_credito',
    label: 'Voucher Tarjeta Crédito',
    hasIVA: true
  },
  VOUCHER_DEBITO: {
    id: 'voucher_debito',
    label: 'Voucher Tarjeta Débito',
    hasIVA: true
  },
  OTRO: {
    id: 'otro',
    label: 'Otro Documento',
    hasIVA: false
  },
  SIN_DOCUMENTO: {
    id: 'sin_documento',
    label: 'Sin Documento',
    hasIVA: false
  }
};

// Función helper para obtener la lista de documentos para select/dropdown
export const getDocumentTypesForSelect = () => {
  return Object.values(DOCUMENT_TYPES).map(type => ({
    value: type.id,
    label: type.label
  }));
};

// Función helper para verificar si un tipo de documento lleva IVA
export const documentHasIVA = (documentTypeId) => {
  const documentType = Object.values(DOCUMENT_TYPES).find(type => type.id === documentTypeId);
  return documentType ? documentType.hasIVA : false;
};

// Función helper para obtener el label de un tipo de documento por su ID
export const getDocumentTypeLabel = (documentTypeId) => {
  const documentType = Object.values(DOCUMENT_TYPES).find(type => type.id === documentTypeId);
  return documentType ? documentType.label : '';
};