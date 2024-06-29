import React, { useMemo, useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import SlipDocument from './SlipDocument';

const usePDFSlip = (ticketSummary,buyerName,fileName = 'print-slip.pdf') => {
    const [showModal, setShowModal] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    const toggleModal = () => {
        setCurrentDateTime(new Date());
        setShowModal(!showModal);
    };

    const document = useMemo(() => (
        <SlipDocument ticketSummary={ticketSummary} currentDateTime={currentDateTime} name={buyerName}/>
    ), [ticketSummary, currentDateTime]);

    return (
        <div className="p-5">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={toggleModal}>
                Preview PDF
            </button>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white p-5 w-2/3 h-full overflow-y-auto">
                        <PDFViewer className="w-full h-full">{document}</PDFViewer>
                        <div className="mt-4">
                            <PDFDownloadLink document={document} fileName={fileName}>
                                {({ loading }) => (loading ? 'Loading document...' : 'Download PDF')}
                            </PDFDownloadLink>
                            <button className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={toggleModal}>
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default usePDFSlip;