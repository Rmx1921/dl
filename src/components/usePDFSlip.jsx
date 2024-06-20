import { useMemo } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 20 },
    section: { margin: 10, padding: 10, border: '1px solid #000' }
});

const SlipDocument = ({ ticketSummary }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text style={{ fontSize: 20, marginBottom: 10 }}>Printing Slip</Text>
                <Text>-------------------------------------------------------------------</Text>
                {Object.entries(ticketSummary).map(([prefix, { start, end, count }]) => (
                    <View key={prefix} style={{ marginBottom: 5 }}>
                        <Text>Serial: {prefix}</Text>
                        <Text>Start Serial: {start}</Text>
                        <Text>End Serial: {end}</Text>
                        <Text>Count: {count}</Text>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);

const usePDFSlip = (ticketSummary, fileName = 'print-slip.pdf') => {
    const document = useMemo(() => <SlipDocument ticketSummary={ticketSummary} />, [ticketSummary]);
    const downloadLink = useMemo(
        () => (
            <PDFDownloadLink document={document} fileName={fileName}>
                {({ loading }) => (loading ? 'Loading document...' : 'Download PDF')}
            </PDFDownloadLink>
        ),
        [document, fileName]
    );

    return downloadLink;
};

export default usePDFSlip;