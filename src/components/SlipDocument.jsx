import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30 },
    header: { marginBottom: 10, textAlign: 'center' },
    section: { marginBottom: 10 },
    boldText: { fontWeight: 'bold' },
    borderBottom: { borderBottom: '1px solid black', marginBottom: 10 },
    textCenter: { textAlign: 'center' }
});

const SlipDocument = ({ ticketSummary, currentDateTime,name}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={[styles.section, styles.header]}>
                <Text style={styles.boldText}>xxxxxxxxxxxxxxxxxx</Text>
                <Text>Kuthuparamba, Mob: xxxxxxxxxx</Text>
            </View>
            <View style={styles.section}>
                <Text>Date: {currentDateTime.toLocaleDateString()}</Text>
                <Text>Time: {currentDateTime.toLocaleTimeString()}</Text>
                <Text>Name: {name}</Text>
                <Text>Mob: 8848780005</Text>
            </View>
            <View style={styles.borderBottom} />
            <View style={styles.section}>
                <Text style={styles.boldText}>S.No Lottery Draw Qty Rate Value</Text>
                {Object.entries(ticketSummary).map(([key, summary], index) => (
                    <View key={index} style={styles.section}>
                        <Text>{index + 1} {key}</Text>
                        <Text>{summary.start} to {summary.end} - {summary.count} tickets</Text>
                    </View>
                ))}
            </View>
            <View style={styles.borderBottom} />
            <View style={styles.section}>
                <Text>Total Tickets: {Object.values(ticketSummary).reduce((acc, curr) => acc + curr.count, 0)}</Text>
                <Text>Net Amt: 19692.75</Text>
                <Text>G.Total: 21645.75</Text>
                <Text>Cash: 21646</Text>
                <Text>PWT: 0</Text>
                <Text>Cur Balance: 145066.80</Text>
            </View>
            <View style={[styles.section, styles.textCenter]}>
                <Text>Dc Claimed Within 30 Days.</Text>
                <Text>Page: 1</Text>
            </View>
        </Page>
    </Document>
);

export default SlipDocument;