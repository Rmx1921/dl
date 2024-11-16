import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import ExportImportModal from '../DataExport';
import CancelModal from './modal/CancelModal';

const ModalManager = () => {
    const { modalState } = useModal();

    const renderModal = () => {
        switch (modalState.type) {
            case 'EXPORT_IMPORT':
                return <ExportImportModal />;
            case 'CANCEL_BUTTON':
                return <CancelModal />;
            default:
                return null;
        }
    };

    return renderModal(); 
};

export default ModalManager;