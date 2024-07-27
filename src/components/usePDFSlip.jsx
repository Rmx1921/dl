import React, { useMemo, useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import SlipDocument from './SlipDocument';

const usePDFSlip = (ticketSummary, buyerName, fileName = 'print-slip.pdf') => {
    const [showModal, setShowModal] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    const toggleModal = () => {
        setCurrentDateTime(new Date());
        setShowModal(!showModal);
    };

    const document = useMemo(() => (
        <SlipDocument ticketSummary={ticketSummary} currentDateTime={currentDateTime} name={buyerName}/>
    ), [ticketSummary, currentDateTime, buyerName]);

    return (
        <div className="p-5">
            <button 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                onClick={toggleModal}
            >
                Preview PDF
            </button>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold">PDF Preview</h2>
                            <button 
                                className="text-gray-500 hover:text-gray-700 transition duration-300"
                                onClick={toggleModal}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <PDFViewer className="w-full h-full">{document}</PDFViewer>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end space-x-4">
                            <PDFDownloadLink 
                                document={document} 
                                fileName={fileName}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                            >
                                {({ loading }) => (loading ? 'Preparing download...' : 'Download PDF')}
                            </PDFDownloadLink>
                            <button 
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                                onClick={toggleModal}
                            >
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