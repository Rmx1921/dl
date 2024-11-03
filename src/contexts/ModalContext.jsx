import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        data: null
    });

    const openModal = useCallback((type, data = null) => {
        setModalState({
            isOpen: true,
            type,
            data
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalState({
            isOpen: false,
            type: null,
            data: null
        });
    }, []);

    return (
        <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => useContext(ModalContext);