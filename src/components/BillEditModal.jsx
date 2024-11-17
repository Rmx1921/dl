import React, { useState } from 'react';
import { openDB } from 'idb';

const BillEditModal = ({ isOpen, onClose, billData, onUpdateBill }) => {
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    
    async function updateSelectedTicketsStatus(selectedTickets) {
        try {
            const db = await openDB('lotteryDB', 2);
            const tx = db.transaction('ticketsData', 'readwrite');
            const store = tx.objectStore('ticketsData');

            for (const ticket of selectedTickets) {
                const existingTicket = await store.get(ticket.unique);
                if (existingTicket) {
                    existingTicket.state = true;
                    await store.put(existingTicket);
                }
            }

            await tx.done;
            console.log('Selected tickets status updated successfully');
        } catch (error) {
            console.error('Error updating ticket status:', error);
        }
    }

    const groupedTickets = billData.tickets.reduce((acc, ticket) => {
        const [startSerial, endSerial, startNumber, endNumber, ticketname, serialNumber, drawDate] = ticket.identifier.split('-');
        const mainKey = `${startSerial}-${endSerial} (${startNumber}-${endNumber}) - ${ticketname}`;

        if (!acc[mainKey]) {
            acc[mainKey] = {
                info: {
                    serialNumber,
                    drawDate: new Date(drawDate).toLocaleDateString(),
                    totalTickets: 0
                },
                subGroups: {}
            };
        }

        const subKey = `${ticket.serial}-${startNumber} to ${ticket.serial}-${endNumber}`;
        if (!acc[mainKey].subGroups[subKey]) {
            acc[mainKey].subGroups[subKey] = [];
        }

        acc[mainKey].subGroups[subKey].push(ticket);
        acc[mainKey].info.totalTickets += 1;
        return acc;
    }, {});

    const groupTicketsInFives = (tickets) => {
        return tickets.reduce((acc, ticket, index) => {
            const groupIndex = Math.floor(index / 5);
            if (!acc[groupIndex]) {
                acc[groupIndex] = [];
            }
            acc[groupIndex].push(ticket);
            return acc;
        }, []);
    };

    const handleGroupExpand = (groupKey) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    };

    const handleCancel = ()=>{
        setSelectedTickets(new Set());
        onClose()
    }

    const handleSelectTicket = (ticket, groupKey = null) => {
        setSelectedTickets(prevSelected => {
            const newSelected = new Set(prevSelected);

            if (groupKey) {
                const [mainKey, subKey, groupIndex] = groupKey.split('|');
                const mainGroup = Object.entries(groupedTickets).find(([key]) => key === mainKey);

                if (mainGroup) {
                    let ticketsToToggle;
                    if (groupIndex !== undefined) {
                        ticketsToToggle = groupTicketsInFives(mainGroup[1].subGroups[subKey])[parseInt(groupIndex)];
                    } else if (subKey) {
                        ticketsToToggle = mainGroup[1].subGroups[subKey];
                    } else {
                        ticketsToToggle = Object.values(mainGroup[1].subGroups).flat();
                    }

                    const allSelected = ticketsToToggle.every(t => newSelected.has(t));
                    ticketsToToggle.forEach(t => {
                        if (allSelected) {
                            newSelected.delete(t);
                        } else {
                            newSelected.add(t);
                        }
                    });
                }
            } else if (ticket) {
                if (newSelected.has(ticket)) {
                    newSelected.delete(ticket);
                } else {
                    newSelected.add(ticket);
                }
            }
            return newSelected;
        });
    };
     
    const calculateTotal = (item,price) => {
       let total = item.length * price;
        return total
    };

    const totalPayable = (totalprice,pwt) => {
        let total = totalprice - pwt
        return total
    };
   
    const handleRemoveTickets = () => {
        const remainingTickets = billData.tickets.filter(ticket => !selectedTickets.has(ticket));
        let total = calculateTotal(Array.from(remainingTickets),billData?.ticketPrice)
        let totalpayable = totalPayable(total,billData?.pwt)
        onUpdateBill({
            ...billData,
            type:'Duplicate',
            date: new Date(),
            totalAmount: total.toFixed(2),
            tickets: remainingTickets,
            totalPayable: totalpayable
        });
        updateSelectedTicketsStatus(Array.from(selectedTickets))
        setSelectedTickets(new Set());
    };

    return (
        isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg max-w-4xl w-full">
                    <h2 className="text-lg font-bold mb-4">Edit Bill - {billData.billno}</h2>

                    <div className="max-h-96 overflow-y-auto">
                        {Object.entries(groupedTickets).map(([mainKey, groupData]) => (
                            <div key={mainKey} className="my-2 border border-gray-200 p-2 rounded-md">
                                <div className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Object.values(groupData.subGroups).flat().every(t => selectedTickets.has(t))}
                                        onChange={() => handleSelectTicket(null, mainKey)}
                                        className="mr-2"
                                    />
                                    <span onClick={() => handleGroupExpand(mainKey)} className="flex-grow">
                                        {expandedGroups.has(mainKey) ? '▼' : '▶'} {mainKey}
                                        {groupData.info &&
                                            ` (${groupData.info.totalTickets} tickets) [Serial: ${groupData.info.serialNumber}, Draw Date: ${groupData.info.drawDate}]`
                                        }
                                    </span>
                                </div>

                                {expandedGroups.has(mainKey) && (
                                    <div className="ml-6 mt-2">
                                        {Object.entries(groupData.subGroups).map(([subKey, tickets]) => (
                                            <div key={subKey} className="my-1">
                                                <div className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={tickets.every(t => selectedTickets.has(t))}
                                                        onChange={() => handleSelectTicket(null, `${mainKey}|${subKey}`)}
                                                        className="mr-2"
                                                    />
                                                    <span onClick={() => handleGroupExpand(`${mainKey}-${subKey}`)}>
                                                        {expandedGroups.has(`${mainKey}-${subKey}`) ? '▼' : '▶'} {subKey}
                                                    </span>
                                                </div>

                                                {expandedGroups.has(`${mainKey}-${subKey}`) && (
                                                    <div className="ml-6 mt-2">
                                                        {groupTicketsInFives(tickets).map((ticketGroup, groupIndex) => (
                                                            <div key={groupIndex} className="my-1">
                                                                <div className="flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={ticketGroup.every(t => selectedTickets.has(t))}
                                                                        onChange={() => handleSelectTicket(null, `${mainKey}|${subKey}|${groupIndex}`)}
                                                                        className="mr-2"
                                                                    />
                                                                    <span>
                                                                        {ticketGroup[0].serial}-{ticketGroup[0].number} to {ticketGroup[ticketGroup.length - 1].serial}-{ticketGroup[ticketGroup.length - 1].number}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={handleRemoveTickets}
                            disabled={selectedTickets.size === 0}
                            className={`px-4 py-2 rounded ${selectedTickets.size === 0
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                        >
                            Remove Selected Tickets
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    );
};

export default BillEditModal;