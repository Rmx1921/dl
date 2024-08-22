import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import Modal from 'react-modal';
import { ipcRenderer } from 'electron';

const modalStyles = {
    overlay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        position: 'relative',
        top: 'auto',
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        width: '80%',
        height: '80%',
        padding: '20px',
        overflow: 'hidden',
    },
};

const styles = {
    page: {
        fontFamily: 'Helvetica, Arial, sans-serif',
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
    },
    header: {
        marginBottom: '10px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
    },
    subheader: {
        textAlign: 'center',
        fontSize: '14px',
        marginBottom: '20px',
    },
    infoColumn: {
        flex: '1',
    },
    boldText: { fontWeight: 'bold' },
    borderBottom: {
        borderBottom: '1px dashed black',
        margin: '10px 0',
    },
    ticketSection: {
        marginBottom: '15px',
    },
    ticketHeader: {
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '5px',
    },
    groupSection: {
        marginLeft: '20px',
        marginBottom: '10px',
    },
    seriesText: {
        fontWeight: 'bold',
        marginBottom: '5px',
    },
    rangeTable: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHeader: {
        borderBottom: '1px solid black',
        textAlign: 'left',
        padding: '5px',
    },
    tableCell: {
        padding: '5px',
        fontFamily: 'Courier, monospace',
        fontSize: '12px',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        zIndex: '10',
        padding: '10px 20px',
        borderTop: '1px solid #ccc',
    },
    button: {
        padding: '10px 20px',
        cursor: 'pointer',
    },
    printHide: {
        '@media print': {
            display: 'none',
        },
    },
    contentContainer: {
        height: 'calc(100% - 60px)',
        overflowY: 'auto',
        paddingBottom: '60px',
    },
};

const PrintableContent = forwardRef(({ ticketSummary, currentDateTime, name, pwt }, ref) => {
    const contentRef = useRef();

    const formattedDate = (date) => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const period = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
        const out = `${hours}.${minutes} ${period}`;
        return out;
    }
    let out = formattedDate(currentDateTime)

    useImperativeHandle(ref, () => ({
        print: () => contentRef.current,
    }));

    const calculateTotal = (item) => {
        const total = item.groups.reduce((acc, group) => {
            return acc + group.ranges.reduce((groupAcc, range) => {
                return groupAcc + range.count * range.price;
            }, 0);
        }, 0);
        return pwt ? total - pwt : total;
    };

    const calculateTotalQuantity = (item) => {
        return item.groups.reduce((acc, group) => {
            return acc + group.ranges.reduce((groupAcc, range) => {
                return groupAcc + range.count;
            }, 0);
        }, 0);
    };

    return (
        <div ref={contentRef} style={styles.page}>
            <div style={styles.header}>Devan Lottery Agency</div>
            <div style={styles.subheader}>Mambaram, Mob: 9497050070, 8848578005</div>

            <div className='flex justify-between'>
                <div style={styles.infoColumn}>
                    <p><span style={styles.boldText}>Date:</span> {currentDateTime.toLocaleDateString()}</p>
                    <p><span style={styles.boldText}></span> {out}</p>
                </div>
                <div className='item-end'>
                    <p><span style={styles.boldText}>Name:</span> {name}</p>
                    <p><span style={styles.boldText}>Mob:</span> 8848780005</p>
                </div>
            </div>

            <div style={styles.borderBottom} />

            <table style={styles.rangeTable}>
                <thead>
                    <tr>
                        <th style={styles.tableHeader}>No</th>
                        <th style={styles.tableHeader}>Lottery Draw</th>
                        <th style={styles.tableHeader}>Qty</th>
                        <th style={styles.tableHeader}>Rate</th>
                        <th style={styles.tableHeader}>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {ticketSummary.map((item, index) => (
                        <React.Fragment key={index}>
                            <tr>
                                <td style={styles.tableCell}>{index + 1}.</td>
                                <td style={styles.tableCell}>{item.ticketname} - {item.drawDate}</td>
                                <td style={styles.tableCell}></td>
                                <td style={styles.tableCell}></td>
                                <td style={styles.tableCell}></td>
                            </tr>
                            {item.groups.map((group, groupIndex) => (
                                <React.Fragment key={groupIndex}>
                                    <tr>
                                        <td style={styles.tableCell}></td>
                                        <td style={styles.tableCell}>({group.series})</td>
                                        <td style={styles.tableCell}></td>
                                        <td style={styles.tableCell}></td>
                                        <td style={styles.tableCell}></td>
                                    </tr>
                                    {group.ranges.map((range, rangeIndex) => (
                                        <tr key={rangeIndex}>
                                            <td style={styles.tableCell}></td>
                                            <td style={styles.tableCell}>{`${range.startNumber.padStart(6, '0')}-${range.endNumber.padStart(6, '0')}`}</td>
                                            <td style={styles.tableCell}>{range.count.toString().padStart(3, ' ')}</td>
                                            <td style={styles.tableCell}>{range.price.toFixed(2)}</td>
                                            <td style={styles.tableCell}>{(range.count * range.price).toFixed(2).padStart(9, ' ')}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    ))}
                    <tr>
                        <td colSpan="5" style={{ ...styles.tableCell, borderTop: '1px solid black' }}></td>
                    </tr>
                    <tr>
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}>Total</td>
                        <td style={styles.tableCell}>{calculateTotalQuantity(ticketSummary[0])}</td>
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}>₹ {calculateTotal(ticketSummary[0]).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colSpan="5" style={{ ...styles.tableCell, borderTop: '1px solid black' }}></td>
                    </tr>
                </tbody>
            </table>
            <div className='item-start'>
                <p><span>PWT:</span> ₹ {pwt}</p>
            </div>
        </div>
    );
});

const SlipModal = ({ isOpen, onRequestClose, ticketSummary, currentDateTime, name, pwt }) => {
    const printableRef = useRef();

    const handlePrint = () => {
        ipcRenderer.send('print-to-pdf');
    };

    if (!ticketSummary || ticketSummary.length === 0) {
        return (
            <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={modalStyles}>
                <div style={styles.page}>
                    <p>No data available</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={modalStyles}>
            <div style={styles.contentContainer}>
                <PrintableContent
                    ref={printableRef}
                    ticketSummary={ticketSummary}
                    currentDateTime={currentDateTime}
                    name={name}
                    pwt={pwt}
                />
            </div>
            <div style={{ ...styles.buttonContainer, ...styles.printHide }}>
                <button onClick={handlePrint} style={styles.button}>Print</button>
                <button onClick={onRequestClose} style={styles.button}>Edit</button>
            </div>
        </Modal>
    );
};

export default SlipModal;