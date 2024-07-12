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
    const [ticketNames, setTicketNames] = useState([]);
const [selectedTicketName, setSelectedTicketName] = useState('');

    useEffect(() => {
        async function fetchTickets() {
            const ticketsFromDB = await getAllTicketsFromDB();
            setAllTickets(ticketsFromDB);
            const uniqueTicketNames = [...new Set(ticketsFromDB.map(ticket => ticket.ticketname))];
            setTicketNames(uniqueTicketNames);
        }

        fetchTickets();
    }, []);

    const handleTicketNameChange = (event) => {
        setSelectedTicketName(event.target.value);
        if (event.target.value) {
            const filteredResults = searchResults.filter(ticket => ticket.ticketname === event.target.value);
            setDisplayedTickets(filteredResults.slice(0, ticketsToShow));
        } else {
            setDisplayedTickets(searchResults.slice(0, ticketsToShow));
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (allTickets.length > 0) {
                searchTickets();
            }
        }, 300);
    
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, allTickets, selectedTicketName]);

    const searchTickets = () => {
        if (searchQuery.trim() === '' && !selectedTicketName) {
            setSearchResults([]);
            setDisplayedTickets([]);
            return;
        }
    
        const searchQueryLowerCase = searchQuery.toLowerCase();
        const filteredTickets = allTickets.filter(ticket => {
            const [serialPart, numberPart] = searchQueryLowerCase.split('-');
    
            const serialMatch = ticket.serial.toLowerCase().includes(serialPart);
    
            const numberMatch = numberPart
                ? ticket.number.toString().startsWith(numberPart)
                : true;
    
            const otherFieldsMatch = 
                ticket.id.toLowerCase().includes(searchQueryLowerCase) ||
                ticket.ticketname.toLowerCase().includes(searchQueryLowerCase) ||
                ticket.serialNumber.toLowerCase().includes(searchQueryLowerCase);
    
            const ticketNameMatch = selectedTicketName ? ticket.ticketname === selectedTicketName : true;
    
            return ((serialMatch && numberMatch) || otherFieldsMatch) && ticketNameMatch;
        });
    
        setSearchResults(filteredTickets);
        setDisplayedTickets(filteredTickets.slice(0, ticketsToShow));
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
                <div className="bg-white p-6 rounded-lg max-w-4xl w-full flex">
                    <div className="w-1/2 p-4">
                        <h2 className="text-lg font-bold mb-4">Billing Information</h2>
                        <div className='flex flex-row gap-3'>
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
                                <select
                                    value={selectedTicketName}
                                    onChange={handleTicketNameChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Ticket Name</option>
                                    {ticketNames.map((name, index) => (
                                        <option key={index} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
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
                        <button onClick={onClose} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Close
                        </button>
                        <div className='mt-4'>
                            {selectedTickets.size > 0 && buyerName.trim() !== '' && downloadLink}
                        </div>
                    </div>
                    <div className="w-1/2 p-4 border-l border-gray-200">
                        <h2 className="text-lg font-bold mb-4">Search Results</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {displayedTickets.length > 0 ? (
                                <div>
                                    {displayedTickets.map((ticket, index) => (
                                        <div key={index} className="my-2 border border-gray-200 p-2 rounded-md">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTickets.has(ticket)}
                                                    onChange={() => handleSelectTicket(ticket)}
                                                    className="mr-2"
                                                />
                                                <span>
                                                    {ticket.id}, {ticket.serial} - {ticket.number}, {ticket.ticketname}, {ticket.serialNumber}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {searchResults.length > displayedTickets.length && (
                                        <button onClick={handleLoadMore} className="text-blue-500 hover:text-blue-700 cursor-pointer mt-2">
                                            Load More
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Enter ticket serial, number, name, or ID</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default BillingModal;