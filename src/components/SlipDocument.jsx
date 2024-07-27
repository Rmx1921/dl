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

    const sortedGroups = Object.entries(ticketSummary)
    .sort(([, a], [, b]) => b.serialNumber.localeCompare(a.serialNumber));

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
                {sortedGroups.map(([key, group], index) => (
                    <View key={key} style={styles.section}>
                        <Text style={styles.boldText}>
                            {index + 1}. {group.ticketname} {group.serialNumber} - Draw date: {group.drawDate}
                        </Text>
                        <Text>({Array.from(group.series).sort().join(',')})</Text>
                        {Object.entries(group.ranges)
                            .sort(([a], [b]) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]))
                            .map(([rangeKey, range]) => (
                                <Text key={rangeKey} style={styles.monospaceText}>
                                    {`${range.start.padStart(6, '0')}-${range.end.padStart(6, '0')}    ${range.count.toString().padStart(3, ' ')}         32.55    ${(range.count * 32.55).toFixed(2).padStart(9, ' ')}`}
                                </Text>
                            ))
                        }
                    </View>
                ))}
            </View>
            <View style={styles.borderBottom} />
        </Page>
    </Document>
    );
};
export default SlipDocument;