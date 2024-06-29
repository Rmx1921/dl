import React, { useState, useEffect } from 'react';
import { getAllTicketsFromDB } from '../helpers/indexdb';
import usePDFSlip from './usePDFSlip';

const BillingModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({});
    const [allTickets, setAllTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [buyerName, setBuyerName] = useState('');

    useEffect(() => {
        async function fetchTickets() {
            const ticketsFromDB = await getAllTicketsFromDB();
            setAllTickets(ticketsFromDB);
        }

        fetchTickets();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            searchTickets();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const searchTickets = () => {
        if (searchQuery.trim() === '') {
            setSearchResults({});
            return;
        }

        const searchQueryLowerCase = searchQuery.toLowerCase();
        const filteredTickets = allTickets.filter(ticket => {
            return (
                ticket.serial.toLowerCase().includes(searchQueryLowerCase) ||
                ticket.number.toString().includes(searchQueryLowerCase) ||
                ticket.ticketname.toLowerCase().includes(searchQueryLowerCase) ||
                ticket.serialNumber.toLowerCase().includes(searchQueryLowerCase)
            );
        });

        const groupedResults = filteredTickets.reduce((acc, ticket) => {
            const key = ticket.serial.substring(0, 2);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(ticket);
            return acc;
        }, {});

        setSearchResults(groupedResults);
    };

    const handleSearchInputChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleBuyerNameChange = (event) => {
        setBuyerName(event.target.value);
    };

    const handleLoadMore = () => {
        const selected = Object.values(searchResults).flat();
        setSelectedTickets(new Set(selected));
    };

    const handleSelectTicket = (ticket) => {
        setSelectedTickets(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(ticket)) {
                newSelected.delete(ticket);
            } else {
                newSelected.add(ticket);
            }
            return newSelected;
        });
    };

    const selectedTicketSummary = Array.from(selectedTickets).reduce((acc, ticket) => {
        const key = `${ticket.serial}-${ticket.ticketname}`;
        if (!acc[key]) {
            acc[key] = {
                start: ticket.serial + ticket.number.toString(),
                end: ticket.serial + ticket.number.toString(),
                count: 1,
            };
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
                <div className="bg-white p-6 rounded-lg max-w-md w-full">
                    <h2 className="text-lg font-bold mb-4">Billing Information</h2>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search Ticket Serial..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Enter Buyer's Name"
                            value={buyerName}
                            onChange={handleBuyerNameChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    {Object.keys(searchResults).length > 0 ? (
                        <div>
                            {Object.keys(searchResults).map((prefix, index) => {
                                const tickets = searchResults[prefix];
                                const firstTicket = tickets[0];
                                const lastTicket = tickets[tickets.length - 1];
                                return (
                                    <div key={index} className="my-2 border border-gray-200 p-2 rounded-md">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={tickets.every(ticket => selectedTickets.has(ticket))}
                                                onChange={() => tickets.forEach(ticket => handleSelectTicket(ticket))}
                                                className="mr-2"
                                            />
                                            <span>
                                                {firstTicket.serial} - {firstTicket.number}, {firstTicket.ticketname}, {firstTicket.serialNumber} to {lastTicket.serial} - {lastTicket.number}, {lastTicket.ticketname}, {lastTicket.serialNumber}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(searchResults).length > 5 && (
                                <button onClick={handleLoadMore} className="text-blue-500 hover:text-blue-700 cursor-pointer mt-2">
                                    Load More
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Enter Ticket serial no</p>
                    )}

                    <div className='mt-4'>
                        {selectedTickets.size > 0 && buyerName.trim() !== '' && downloadLink}
                    </div>

                    <button onClick={onClose} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Close
                    </button>
                </div>
            </div>
        )
    );
};

export default BillingModal;
