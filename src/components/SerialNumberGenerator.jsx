import React, { useState, useEffect, useRef } from 'react';
import usePDFSlip from './usePDFSlip';
import { saveTicketsToDB, getAllTicketsFromDB, updateTicketInDB, deleteTicketFromDB } from '../helpers/indexdb';
import { toast } from 'react-toastify';
import 'react-calendar/dist/Calendar.css';
import BillingModal from './BillingModal'

class Lottery {
    constructor(serial, number, ticketname, serialNumber, state) {
        this.id = `${serial}-${number}`;
        this.serial = serial;
        this.number = number;
        this.ticketname = ticketname;
        this.serialNumber = serialNumber;
        this.state = state;
    }
}


const generateLotteryTickets = (firstSerial, lastSerial, firstNumber, lastNumber, ticketname, serialNumber) => {
    const ticket_arr = [];
    let temp_first_lott_ser = firstSerial;
    let temp_first_lottery_num = firstNumber;
    const alphabet_limit = (lastSerial.charCodeAt(1) - firstSerial.charCodeAt(1)) + 1;

    for (let alphabet = 0; alphabet < alphabet_limit; alphabet++) {
        if (temp_first_lott_ser[1] !== 'I' && temp_first_lott_ser[1] !== 'Q') {
            for (let num = 0; num < 25; num++) {
                ticket_arr.push(new Lottery(temp_first_lott_ser, temp_first_lottery_num, ticketname, serialNumber, true));
                temp_first_lottery_num++;
                if (temp_first_lottery_num > lastNumber) break;
            }
            temp_first_lottery_num = firstNumber;
        }
        temp_first_lott_ser = temp_first_lott_ser[0] + String.fromCharCode(temp_first_lott_ser.charCodeAt(1) + 1);
    }

    return ticket_arr;
};

const LotteryTicketGenerator = () => {
    const [firstSerial, setFirstSerial] = useState('');
    const [lastSerial, setLastSerial] = useState('');
    const [firstNumber, setFirstNumber] = useState('');
    const [lastNumber, setLastNumber] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [lotteryTickets, setLotteryTickets] = useState([]);
    const [selectedSerials, setSelectedSerials] = useState([]);
    const [ticketname, setTicketName] = useState('');
    const [showDropdown, setShowDropdown] = useState({});
    const dropdownRefs = useRef({});
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    const openBillingModal = () => {
        setIsBillingModalOpen(true);
    };

    const closeBillingModal = () => {
        setIsBillingModalOpen(false);
    };

    useEffect(() => {
        async function fetchTickets() {
            const ticketsFromDB = await getAllTicketsFromDB();
            setLotteryTickets(ticketsFromDB);
        }

        fetchTickets();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            Object.keys(dropdownRefs.current).forEach(prefix => {
                if (dropdownRefs.current[prefix] && !dropdownRefs.current[prefix].contains(event.target)) {
                    setShowDropdown(prevState => ({ ...prevState, [prefix]: false }));
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleGenerate = async () => {
        const firstNum = parseInt(firstNumber, 10);
        const lastNum = parseInt(lastNumber, 10);
        const newTickets = generateLotteryTickets(firstSerial, lastSerial, firstNum, lastNum, ticketname, serialNumber);
        const ticketsFromDB = await getAllTicketsFromDB();
    
        const filteredNewTickets = newTickets.filter(newTicket => {
            return !ticketsFromDB.some(existingTicket => existingTicket.id === newTicket.id);
        });
    
        if (filteredNewTickets.length > 0) {
            const updatedTickets = [...lotteryTickets, ...filteredNewTickets];
            setLotteryTickets(updatedTickets);
            await saveTicketsToDB(filteredNewTickets);
            toast.success('New tickets have been added successfully.');
        } else {
            toast.error('No new tickets to add or some tickets are already existing in the specified range.');
        }
    };
        

    const handleSelectSerial = (serial) => {
        const updatedTickets = lotteryTickets.map(ticket => {
            if (ticket.serial === serial) {
                ticket.state = !ticket.state;
            }
            return ticket;
        });
        setLotteryTickets(updatedTickets);
        setSelectedSerials((prevSelectedSerials) =>
            prevSelectedSerials.includes(serial)
                ? prevSelectedSerials.filter((s) => s !== serial)
                : [...prevSelectedSerials, serial]
        );
    };

    const handleUpdateTicket = async (updatedTicket) => {
        const updatedTickets = lotteryTickets.map(ticket =>
            ticket.serial === updatedTicket.serial && ticket.number === updatedTicket.number ? updatedTicket : ticket
        );
        setLotteryTickets(updatedTickets);
        await updateTicketInDB(updatedTicket);
    };

    const handleDeleteTicket = async (ticketId) => {
        const filteredTickets = lotteryTickets.filter(ticket => ticket.id !== ticketId);
        setLotteryTickets(filteredTickets);
        await deleteTicketFromDB(ticketId);
    };

    const summarizeTicketsByPrefix = () => {
        const ticketSummary = {};

        lotteryTickets.forEach(ticket => {
            const prefix = ticket.serial[0];
            const key = `${prefix}-${ticket.ticketname}`;

            if (!ticketSummary[key]) {
                ticketSummary[key] = {
                    start: ticket.serial + ticket.number.toString(),
                    end: ticket.serial + ticket.number.toString(),
                    count: 1
                };
            } else {
                ticketSummary[key].end = ticket.serial + ticket.number.toString();
                ticketSummary[key].count += 1;
            }
        });

        return ticketSummary;
    };

    const TicketsByPrefix = () => {
        const ticketSummary = {};

        lotteryTickets.forEach(ticket => {
            const prefix = ticket.serial[0];
            const key = `${prefix}-${ticket.ticketname}`;
            const serialNumber = ticket.serial + ticket.number.toString();

            if (!ticketSummary[key]) {
                ticketSummary[key] = {
                    start: serialNumber,
                    end: serialNumber,
                    count: 1,
                    serials: [serialNumber]
                };
            } else {
                ticketSummary[key].end = serialNumber;
                ticketSummary[key].count += 1;
                ticketSummary[key].serials.push(serialNumber);
            }
        });

        return ticketSummary;
    };

    const ticketSummary = summarizeTicketsByPrefix();
    const ticketSub = TicketsByPrefix();
    const selectedTicketSummary = Object.fromEntries(
        Object.entries(ticketSummary).filter(([prefix]) => selectedSerials.includes(prefix))
    );
    const downloadLink = usePDFSlip(selectedTicketSummary);

    const toggleDropdown = (prefix) => {
        setShowDropdown(prevState => ({ ...prevState, [prefix]: !prevState[prefix] }));
    };

    return (
        <div className='flex flex-col w-full bg-gradient-to-br from-pink-500 to-yellow-300 min-h-screen p-6'>
            <div className='flex flex-wrap gap-4 justify-center'>
                <div className="mb-4 w-full md:w-1/4">
                    <label className="block mb-2 font-bold text-gray-700">First Serial:</label>
                    <input
                        type="text"
                        value={firstSerial}
                        onChange={(e) => setFirstSerial(e.target.value.toUpperCase().substring(0, 2))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="mb-4 w-full md:w-1/4">
                    <label className="block mb-2 font-bold text-gray-700">Last Serial:</label>
                    <input
                        type="text"
                        value={lastSerial}
                        onChange={(e) => setLastSerial(e.target.value.toUpperCase().substring(0, 2))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="mb-4 w-full md:w-1/4">
                    <label className="block mb-2 font-bold text-gray-700">First Ticket Number:</label>
                    <input
                        type="number"
                        value={firstNumber}
                        onChange={(e) => setFirstNumber(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="mb-4 w-full md:w-1/4">
                    <label className="block mb-2 font-bold text-gray-700">Last Ticket Number:</label>
                    <input
                        type="number"
                        value={lastNumber}
                        onChange={(e) => setLastNumber(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="mb-4 w-full md:w-1/4">
                    <label className="block mb-2 font-bold text-gray-700">Lottery Serial Number:</label>
                    <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="mb-4 w-full md:w-1/4">
                    <label className="block mb-2 font-bold text-gray-700">Ticket Name:</label>
                    <input
                        type="text"
                        value={ticketname}
                        onChange={(e) => setTicketName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="mt-7">
                    <div className='flex flex-row'>
                        <div>
                            <button
                                onClick={handleGenerate}
                                className="w-28 h-12 bg-gradient-to-r from-emerald-400 to-cyan-400"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={openBillingModal}
                        className="w-28 h-12 bg-gradient-to-r from-emerald-400 to-cyan-400 mt-4"
                    >
                        Billing
                    </button>

                </div>
                <div className='mt-7'>
                    {selectedSerials.length > 0 && downloadLink}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border bg-white rounded-lg border-gray-400">
                    <thead>
                        <tr>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Select</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Ticket Name</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Start Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">End Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Count</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(ticketSub).map(([key, { start, end, count, serials }]) => {
                            const [prefix, ticketname] = key.split('-');
                            return (
                                <tr key={key}>
                                    <td className="border border-gray-400 px-4 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedSerials.includes(key)}
                                            onChange={() => handleSelectSerial(key)}
                                        />
                                    </td>
                                    <td className="border border-gray-400 px-4 py-2">{ticketname}</td>
                                    <td className="border border-gray-400 px-4 py-2" onClick={() => toggleDropdown(key)}>
                                        {start}
                                        {showDropdown[key] && (
                                            <div ref={el => dropdownRefs.current[key] = el} className="absolute bg-white border border-gray-300 rounded-md mt-2 overflow-y-auto max-h-48">
                                                {serials.map(serial => (
                                                    <div key={serial} className="px-4 py-2">
                                                        {serial}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="border border-gray-400 px-4 py-2" onClick={() => toggleDropdown(key)}>
                                        {end}
                                        {showDropdown[key] && (
                                            <div ref={el => dropdownRefs.current[key] = el} className="absolute bg-white border border-gray-300 rounded-md mt-2 overflow-y-auto max-h-48">
                                                {serials.map(serial => (
                                                    <div key={serial} className="px-4 py-2">
                                                        {serial}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="border border-gray-400 px-4 py-2">{count}</td>
                                    <td className="border border-gray-400 px-4 py-2">
                                        <button
                                            onClick={() => handleUpdateTicket(ticket)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            Update
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTicket(ticket.id)}
                                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <BillingModal isOpen={isBillingModalOpen} onClose={closeBillingModal} />
        </div>
    );
};

export default LotteryTicketGenerator;
