import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import ExportImportModal from '../DataExport';

const ModalManager = () => {
    const { modalState } = useModal();

    const renderModal = () => {
        switch (modalState.type) {
            case 'EXPORT_IMPORT':
                return <ExportImportModal />;
            default:
                return null;
        }
    };

    return renderModal(); 
};

export default ModalManager;