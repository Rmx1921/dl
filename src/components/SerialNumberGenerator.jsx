import React, { useState, useEffect, useRef } from 'react';
import usePDFSlip from './usePDFSlip';
import { saveTicketsToDB, getAllTicketsFromDB, updateTicketInDB, deleteTicketFromDB } from '../helpers/indexdb';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

class Lottery {
    constructor(serial, number, ticketname, serialNumber) {
        this.serial = serial;
        this.number = number;
        this.ticketname = ticketname;
        this.serialNumber = serialNumber;
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
                ticket_arr.push(new Lottery(temp_first_lott_ser, temp_first_lottery_num, ticketname, serialNumber));
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
        const tickets = generateLotteryTickets(firstSerial, lastSerial, firstNum, lastNum, ticketname, serialNumber);
        setLotteryTickets(tickets);
        setSelectedSerials([]);
        await saveTicketsToDB(tickets);
    };

    const handleSelectSerial = (serial) => {
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
        const startSerial = lotteryTickets[0]?.serial.substring(0, 2);
        const endSerial = lotteryTickets[lotteryTickets.length - 1]?.serial.substring(0, 2);

        if (startSerial && endSerial) {
            ticketSummary[startSerial] = {
                start: lotteryTickets[0].serial + lotteryTickets[0].number.toString(),
                end: lotteryTickets[lotteryTickets.length - 1].serial + lotteryTickets[lotteryTickets.length - 1].number.toString(),
                count: lotteryTickets.length
            };
        }

        return ticketSummary;
    };

    const TicketsByPrefix = () => {
        const ticketSummary = {};
        const startSerial = lotteryTickets[0]?.serial.substring(0, 2);
        const endSerial = lotteryTickets[lotteryTickets.length - 1]?.serial.substring(0, 2);
        const serialsInRange = lotteryTickets.map(ticket => ticket.serial + ticket.number.toString());

        if (startSerial && endSerial) {
            ticketSummary[startSerial] = {
                start: lotteryTickets[0].serial + lotteryTickets[0].number.toString(),
                end: lotteryTickets[lotteryTickets.length - 1].serial + lotteryTickets[lotteryTickets.length - 1].number.toString(),
                count: lotteryTickets.length,
                serials: serialsInRange
            };
        }

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
                    <label className="block mb-2 font-bold text-gray-700">First Serial Number:</label>
                    <input
                        type="text"
                        value={firstSerial}
                        onChange={(e) => setFirstSerial(e.target.value.toUpperCase().substring(0, 2))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="mb-4 w-full md:w-1/4">
                    <label className="block mb-2 font-bold text-gray-700">Last Serial Number:</label>
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
                    <button
                        onClick={handleGenerate}
                        className="w-28 h-12 bg-gradient-to-r from-emerald-400 to-cyan-400"
                    >
                        Save
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border bg-white rounded-lg border-gray-400">
                    <thead>
                        <tr>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Select</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Start Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">End Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Count</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(ticketSub).map(([prefix, { start, end, count, serials }]) => (
                            <tr key={prefix}>
                                <td className="border border-gray-400 px-4 py-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedSerials.includes(prefix)}
                                        onChange={() => handleSelectSerial(prefix)}
                                    />
                                </td>
                                <td className="border border-gray-400 px-4 py-2">{prefix}</td>
                                <td className="border border-gray-400 px-4 py-2" onClick={() => toggleDropdown(prefix)}>
                                    {start}
                                    {showDropdown[prefix] && (
                                        <div ref={el => dropdownRefs.current[prefix] = el} className="absolute bg-white border border-gray-300 rounded-md mt-2 overflow-y-auto max-h-48">
                                            {serials.map(serial => (
                                                <div key={serial} className="px-4 py-2">
                                                    {serial}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="border border-gray-400 px-4 py-2" onClick={() => toggleDropdown(prefix)}>
                                    {end}
                                    {showDropdown[prefix] && (
                                        <div ref={el => dropdownRefs.current[prefix] = el} className="absolute bg-white border border-gray-300 rounded-md mt-2 overflow-y-auto max-h-48">
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
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                {selectedSerials.length > 0 && downloadLink}
            </div>
        </div>
    );
};

export default LotteryTicketGenerator;