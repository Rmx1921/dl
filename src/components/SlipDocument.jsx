import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 20, fontFamily: 'Helvetica' },
    header: { marginBottom: 10, textAlign: 'center' },
    malayalamText: { fontFamily: 'Malayalam', fontSize: 14 },
    monospaceText: { fontFamily: 'Courier', fontSize: 10 },
    section: { marginBottom: 5 },
    boldText: { fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    column: { flexDirection: 'column' },
    borderBottom: { borderBottom: '1px dashed black', marginVertical: 5 },
    barcode: { height: 30, marginBottom: 5 },
    smallText: { fontSize: 8 },
    centerText: { textAlign: 'center' },
    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between' },
    columnText: { width: '25%', textAlign: 'center' }
});

const SlipDocument = ({ ticketSummary, currentDateTime, name }) => {
    if (!ticketSummary || ticketSummary.length === 0) {
        return (
            <Document>
                <Page size="A5" style={styles.page}>
                    <Text>No data available</Text>
                </Page>
            </Document>
        );
    }

    return (
        <Document>
            <Page size="A5" style={styles.page}>
                <View style={[styles.section, styles.header]}>
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
                    {ticketSummary.map((item, index) => (
                        <View key={index} style={styles.section}>
                            <Text style={styles.boldText}>
                                {index + 1}. {item.ticketname} - Draw date: {item.drawDate}
                            </Text>
                            {item.groups.map((group, groupIndex) => (
                                <View key={groupIndex} style={styles.section}>
                                    <Text>({group.series})</Text>
                                    {group.ranges.map((range, rangeIndex) => (
                                        <Text key={rangeIndex} style={styles.monospaceText}>
                                            {`${range.startNumber.padStart(6, '0')}-${range.endNumber.padStart(6, '0')}    ${range.count.toString().padStart(3, ' ')}         ${range.price.toFixed(2)}    ${(range.count * range.price).toFixed(2).padStart(9, ' ')}`}
                                        </Text>
                                    ))}
                                    {/* <Text style={[styles.monospaceText, styles.boldText]}>
                                        {`${'Total:'.padStart(30, ' ')}    ${group.totalAmount.toFixed(2).padStart(9, ' ')}`}
                                    </Text> */}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
                <View style={styles.borderBottom} />
            </Page>
        </Document>
    );
};

export default SlipDocument;