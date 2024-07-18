import React, { useState, useEffect } from 'react';
import { getAllTicketsFromDB } from '../helpers/indexdb';
import usePDFSlip from './usePDFSlip';

const BillingModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [displayedTickets, setDisplayedTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [buyerName, setBuyerName] = useState('');
    const [ticketsToShow, setTicketsToShow] = useState(20);
    const [drawDates, setDrawDates] = useState([]);
    const [selectedDrawDate, setSelectedDrawDate] = useState('');
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    useEffect(() => {
        async function fetchTickets() {
            const ticketsFromDB = await getAllTicketsFromDB();
            setAllTickets(ticketsFromDB);
            const uniqueDrawDates = [...new Set(ticketsFromDB.map(ticket => new Date(ticket.drawDate).toISOString().split('T')[0]))];
            setDrawDates(uniqueDrawDates);
        }
        fetchTickets();
    }, []);

    const handleDrawDateChange = (event) => {
        setSelectedDrawDate(event.target.value);
        searchTickets(searchQuery, event.target.value);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (allTickets.length > 0) {
                searchTickets(searchQuery, selectedDrawDate);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, allTickets, selectedDrawDate]);

    const searchTickets = (query, drawDate) => {
        if (query.trim() === '' && !drawDate) {
            setSearchResults([]);
            setDisplayedTickets([]);
            return;
        }

        const queryLowerCase = query.toLowerCase();
        const filteredTickets = allTickets.filter(ticket => {
            const [serialPart, numberPart] = queryLowerCase.split('-');
            const serialMatch = ticket.serial.toLowerCase().includes(serialPart);
            const numberMatch = numberPart ? ticket.number.toString().startsWith(numberPart) : true;
            const otherFieldsMatch = ticket.id.toLowerCase().includes(queryLowerCase) || ticket.ticketname.toLowerCase().includes(queryLowerCase) || ticket.serialNumber.toLowerCase().includes(queryLowerCase);
            const drawDateMatch = drawDate ? new Date(ticket.drawDate).toISOString().split('T')[0] === drawDate : true;
            return ((serialMatch && numberMatch) || otherFieldsMatch) && drawDateMatch;
        });

        const groupedTickets = filteredTickets.reduce((acc, ticket) => {
            const [startSerial, endSerial, startNumber, endNumber, ticketname, serialNumber, drawDate] = ticket.identifier.split('-');
            const mainKey = `${startSerial}-${endSerial} (${startNumber}-${endNumber}) - ${ticketname}`;
            if (!acc[mainKey]) {
                acc[mainKey] = { info: { serialNumber, drawDate: new Date(drawDate).toLocaleDateString(), totalTickets: 0 }, subGroups: {} };
            }

            const subKey = `${ticket.serial}-${startNumber} to ${ticket.serial}-${endNumber}`;
            if (!acc[mainKey].subGroups[subKey]) {
                acc[mainKey].subGroups[subKey] = [];
            }

            acc[mainKey].subGroups[subKey].push(ticket);
            acc[mainKey].info.totalTickets += 1;
            return acc;
        }, {});

        const results = Object.entries(groupedTickets);
        setSearchResults(results);
        setDisplayedTickets(results.slice(0, ticketsToShow));
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

    const handleSearchInputChange = (event) => {
        let value = event.target.value;
        if (event.nativeEvent.inputType === 'deleteContentBackward') {
            if (value.length === 2 && searchQuery.charAt(2) === '-') {
                value = value.charAt(0);
            }
        } else if (value.length === 2 && /^[a-zA-Z]{2}$/.test(value)) {
            value = value.toUpperCase() + '-';
        }
        setSearchQuery(value);
    };

    const handleBuyerNameChange = (event) => {
        setBuyerName(event.target.value);
    };

    const handleLoadMore = () => {
        setTicketsToShow(prevTicketsToShow => prevTicketsToShow + 20);
        setDisplayedTickets(searchResults.slice(0, ticketsToShow + 20));
    };

    const handleSelectTicket = (ticket, groupKey = null) => {
        setSelectedTickets(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (groupKey) {
                const [mainKey, subKey, groupIndex] = groupKey.split('|');
                const mainGroup = searchResults.find(([key]) => key === mainKey);
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

    const selectedTicketSummary = Array.from(selectedTickets).reduce((acc, ticket) => {
        const key = `${ticket.serial}-${ticket.ticketname}`;
        if (!acc[key]) {
            acc[key] = { start: ticket.serial + ticket.number.toString(), end: ticket.serial + ticket.number.toString(), count: 1 };
        } else {
            acc[key].end = ticket.serial + ticket.number.toString();
            acc[key].count += 1;
        }
        return acc;
    }, {});

    const downloadLink = usePDFSlip(selectedTicketSummary, buyerName);

    return (
        isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg max-w-4xl w-full flex">
                    <div className="w-1/2 p-4">
                        <h2 className="text-lg font-bold mb-4">Billing Information</h2>
                        <div className='flex flex-row gap-3'>
                            <div className="mb-4">
                                <input type="text" placeholder="Search Ticket Serial..." value={searchQuery} onChange={handleSearchInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div className="mb-4">
                                <select value={selectedDrawDate} onChange={handleDrawDateChange} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                                    <option value="">Draw Date</option>
                                    {drawDates.map((date, index) => (
                                        <option key={index} value={date}>{date}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mb-4">
                            <input type="text" placeholder="Enter Buyer's Name" value={buyerName} onChange={handleBuyerNameChange} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <button onClick={onClose} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Close</button>
                        <div className='mt-4'>
                            {selectedTickets.size > 0 && buyerName.trim() !== '' && downloadLink}
                        </div>
                    </div>
                    <div className="w-1/2 p-4 border-l border-gray-200">
                        <h2 className="text-lg font-bold mb-4">Search Results</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {displayedTickets.length > 0 ? (
                                <div>
                                    {displayedTickets.map(([mainKey, groupData]) => (
                                        <div key={mainKey} className="my-2 border border-gray-200 p-2 rounded-md">
                                            <div className="flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={Object.values(groupData.subGroups).flat().every(t => selectedTickets.has(t))} 
                                                    onChange={() => handleSelectTicket(null, mainKey)} 
                                                    className="mr-2" 
                                                />
                                                <span onClick={() => handleGroupExpand(mainKey)} className="flex-grow">
                                                    {expandedGroups.has(mainKey) ? '▼' : '▶'}{' '}{mainKey}
                                                    {groupData && groupData.info ? 
                                                        `(${groupData.info.totalTickets} tickets) [Serial: ${groupData.info.serialNumber}, Draw Date: ${groupData.info.drawDate}]` 
                                                        : '(No info available)'}
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
                                                                <span onClick={() => handleGroupExpand(`${mainKey}-${subKey}`)} className="flex-grow">
                                                                    {expandedGroups.has(`${mainKey}-${subKey}`) ? '▼' : '▶'}{' '}{subKey}
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
                                                                                <span onClick={() => handleGroupExpand(`${mainKey}-${subKey}-${groupIndex}`)}>
                                                                                    {expandedGroups.has(`${mainKey}-${subKey}-${groupIndex}`) ? '▼' : '▶'}{' '}
                                                                                    {ticketGroup[0].serial}-{ticketGroup[0].number} to {ticketGroup[ticketGroup.length-1].serial}-{ticketGroup[ticketGroup.length-1].number}
                                                                                </span>
                                                                            </div>
                                                                            {expandedGroups.has(`${mainKey}-${subKey}-${groupIndex}`) && (
                                                                                <div className="ml-6 mt-2">
                                                                                    {ticketGroup.map((ticket, ticketIndex) => (
                                                                                        <div key={ticketIndex} className="my-1">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={selectedTickets.has(ticket)}
                                                                                                onChange={() => handleSelectTicket(ticket)}
                                                                                                className="mr-2"
                                                                                            />
                                                                                            <span>{ticket.serial}-{ticket.number}</span>
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
                                            )}
                                        </div>
                                    ))}
                                    {searchResults.length > displayedTickets.length && (
                                        <button onClick={handleLoadMore} className="text-blue-500 hover:text-blue-700 cursor-pointer mt-2">Load More</button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Enter ticket serial, number, draw date, or ID</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default BillingModal;