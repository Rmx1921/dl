import React, { useMemo, useState } from 'react';
import { PDFDownloadLink, PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const SlipDocument = ({ ticketSummary }) => (
    <Document>
        <Page size="A4" className="p-5">
            <View className="mb-10 text-center">
                <Text className="font-bold text-lg">xxxxxxxxxxxxxxxxxx</Text>
                <Text>Kuthuparamba,Mob: xxxxxxxxxx</Text>
            </View>
            <View className="mb-5">
                <Text className="mb-2">Date: </Text>
                <Text className="mb-2">Time: 07:32 PM</Text>
                <Text className="mb-2">Name: xxxxx</Text>
                <Text className="mb-2">Mob: 8848780005</Text>
            </View>
            <View className="border-b border-black my-5" />
            <View className="mb-5">
                <Text className="font-bold">S.No Lottery Draw Qty Rate Value</Text>
                <Text className="mb-2">1 NIRMAL 0383 - 07/06/2024</Text>
                <Text className="mb-2">(NN, NO, NP, NR, NS, NT, NU, NV, NW, NX, NY, NZ)</Text>
                <Text className="mb-2">993525 - 993549 300 32.55 9765.00</Text>
                <Text className="mb-2">861940 - 861949 120 32.55 3906.00</Text>
                <Text className="mb-2">730970 - 730974 60 32.55 1953.00</Text>
                <Text className="mb-2">(NR, NY, NZ, NS, NN)</Text>
                <Text className="mb-2">993550 - 993574 125 32.55 4068.75</Text>
            </View>
            <View className="border-b border-black my-5" />
            <View className="mb-5">
                <Text>Total 605 19692.75</Text>
                <Text>Net Amt: 19692.75</Text>
                <Text>G.Total : 21645.75</Text>
                <Text>Cash : 21646</Text>
                <Text>PWT : 0</Text>
                <Text>Cur Balance : 145066.80</Text>
            </View>
            <View className="mt-10">
                <Text>Dc Claimed Within 30 Days.</Text>
                <Text>Page: 1</Text>
            </View>
        </Page>
    </Document>
);

const usePDFSlip = (ticketSummary, fileName = 'print-slip.pdf') => {
    const [showModal, setShowModal] = useState(false);

    const toggleModal = () => {
        setShowModal(!showModal);
    };

    const document = useMemo(() => <SlipDocument ticketSummary={ticketSummary} />, [ticketSummary]);

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