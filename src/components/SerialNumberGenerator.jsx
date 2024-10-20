import React, { useState, useEffect, useRef } from 'react';
import { saveTicketsToDB, getAllTicketsFromDB, updateTicketInDB, deleteTicketFromDB } from '../components/helpers/indexdb'
import { toast } from 'react-toastify';
import BillingModal from './BillingModal';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import PasswordScreen from './PasswordScreen';

class Lottery {
    constructor(serial, number, ticketname, serialNumber, state, drawDate, identifier) {
        this.id = `${serial}-${number}`;
        this.serial = serial;
        this.number = number;
        this.ticketname = ticketname;
        this.serialNumber = serialNumber;
        this.state = state;
        this.drawDate = drawDate;
        this.identifier = identifier;
    }
}

const generateLotteryTickets = (firstSerial, lastSerial, firstNumber, lastNumber, ticketname, serialNumber, drawDate) => {
    const ticket_arr = [];
    let temp_first_lott_ser = firstSerial;
    let temp_first_lottery_num = firstNumber;
    const alphabet_limit = (lastSerial.charCodeAt(1) - firstSerial.charCodeAt(1)) + 1;
    const identifier = `${firstSerial}-${lastSerial}-${firstNumber}-${lastNumber}-${ticketname}-${serialNumber}-${drawDate.toISOString()}`;

    for (let alphabet = 0; alphabet < alphabet_limit; alphabet++) {
        if (temp_first_lott_ser[1] !== 'I' && temp_first_lott_ser[1] !== 'Q') {
            for (let num = 0; num < 25; num++) {
                ticket_arr.push(new Lottery(temp_first_lott_ser, temp_first_lottery_num, ticketname, serialNumber, true, drawDate, identifier));
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    const [drawDate, setDrawDate] = useState(new Date());

    const inputRefs = useRef([]);

    const handleEnterPress = (index) => {
        if (index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const openBillingModal = () => {
        setIsBillingModalOpen(true);
    };

    const closeBillingModal = () => {
        setIsBillingModalOpen(false);
    };

    useEffect(() => {
        async function fetchTickets() {
            try {
                const ticketsFromDB = await getAllTicketsFromDB();
                if (ticketsFromDB.length === 0) {
                    console.log('No tickets found in the database.');
                    setLotteryTickets([]);
                    return;
                }
                const parsedTickets = ticketsFromDB.map(ticket => ({
                    ...ticket,
                    drawDate: new Date(ticket.drawDate)
                }));
                setLotteryTickets(parsedTickets);
            } catch (error) {
                console.error('Error fetching tickets:', error);
                setLotteryTickets([]);
            }
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
        const newTickets = generateLotteryTickets(firstSerial, lastSerial, firstNum, lastNum, ticketname, serialNumber, drawDate);
        const ticketsFromDB = await getAllTicketsFromDB();

        const filteredNewTickets = newTickets.filter(newTicket => {
            return !ticketsFromDB.some(existingTicket => existingTicket.id === newTicket.id);
        });

        if (filteredNewTickets.length > 0) {
            const updatedTickets = [...lotteryTickets, ...filteredNewTickets];
            setLotteryTickets(updatedTickets);
            await saveTicketsToDB(filteredNewTickets);
            toast.success('Tickets added');
        } else {
            toast.error('No new tickets to add or some tickets are already existing in the specified range');
        }
    };

    const handleUpdateTicket = async (updatedTicket) => {
        const updatedTickets = lotteryTickets.map(ticket =>
            ticket.serial === updatedTicket.serial && ticket.number === updatedTicket.number ? updatedTicket : ticket
        );
        setLotteryTickets(updatedTickets);
        await updateTicketInDB(updatedTicket);
    };

    const handleDeleteTicket = async (identifier) => {
        const filteredTickets = lotteryTickets.filter(ticket => ticket.identifier !== identifier);
        setLotteryTickets(filteredTickets);

        const ticketsToDelete = lotteryTickets.filter(ticket => ticket.identifier === identifier);

        for (let ticket of ticketsToDelete) {
            await deleteTicketFromDB(ticket.id);
        }

        toast.success('Tickets deleted successfully.');
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
            const key = ticket.identifier;
            const serialNumber = ticket.serial + ticket.number.toString().padStart(6, '0');

            if (!ticketSummary[key]) {
                ticketSummary[key] = {
                    start: serialNumber,
                    end: serialNumber,
                    count: 1,
                    serials: [serialNumber],
                    ticketname: ticket.ticketname,
                    drawDate: ticket.drawDate,
                    identifier: ticket.identifier
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


    return (
        <div className='flex flex-col w-full bg-gradient-to-br from-pink-500 to-yellow-300 min-h-screen p-8'>
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Devan Lottery</h1>
            <div className='p-6 mb-8'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <InputField label="First Serial" value={firstSerial} onChange={(e) => setFirstSerial(e.target.value.toUpperCase().substring(0, 2))} onEnterPress={() => handleEnterPress(0)} ref={(el) => inputRefs.current[0] = el} />
                    <InputField label="Last Serial" value={lastSerial} onChange={(e) => setLastSerial(e.target.value.toUpperCase().substring(0, 2))} onEnterPress={() => handleEnterPress(1)} ref={(el) => inputRefs.current[1] = el} />
                    <InputField label="First Ticket Number" type="number" value={firstNumber} onChange={(e) => setFirstNumber(e.target.value)} onEnterPress={() => handleEnterPress(2)} ref={(el) => inputRefs.current[2] = el} />
                    <InputField label="Last Ticket Number" type="number" value={lastNumber} onChange={(e) => setLastNumber(e.target.value)} onEnterPress={() => handleEnterPress(3)} ref={(el) => inputRefs.current[3] = el} />
                    <InputField label="Lottery Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} onEnterPress={() => handleEnterPress(4)} ref={(el) => inputRefs.current[4] = el} />
                    <InputField label="Ticket Name" value={ticketname} onChange={(e) => setTicketName(e.target.value)} onEnterPress={() => handleEnterPress(5)} ref={(el) => inputRefs.current[5] = el} />
                    <div className="mb-4">
                        <label className="block mb-2 font-bold text-gray-700">Draw Date:</label>
                        <DatePicker
                            selected={drawDate}
                            onChange={date => setDrawDate(date)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                <div className="flex justify-center mt-6 space-x-4">
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-white font-bold rounded-md hover:from-emerald-500 hover:to-cyan-500 transition duration-300"
                    >
                        Save
                    </button>
                    <button
                        onClick={openBillingModal}
                        className="px-6 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold rounded-md hover:from-purple-500 hover:to-pink-500 transition duration-300"
                    >
                        Billing
                    </button>
                </div>
                <div className='mt-4 flex justify-center'>
                    {selectedSerials.length > 0 && downloadLink}
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            {/* <th className="px-4 py-2 text-left">Select</th> */}
                            <th className="px-4 py-2 text-left">Ticket Name</th>
                            <th className="px-4 py-2 text-left">Start Serial</th>
                            <th className="px-4 py-2 text-left">End Serial</th>
                            <th className="px-4 py-2 text-left">Count</th>
                            <th className="px-4 py-2 text-left">Draw Date</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(ticketSub).map(([key, { start, end, count, serials, ticketname, drawDate, identifier }]) => (
                            <tr key={key} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-2">{ticketname}</td>
                                <td className="px-4 py-2 cursor-pointer" onClick={() => toggleDropdown(key)}>
                                    {start}
                                    {showDropdown[key] && (
                                        <div ref={el => dropdownRefs.current[key] = el} className="absolute bg-white border border-gray-300 rounded-md mt-2 overflow-y-auto max-h-48 z-10">
                                            {serials.map(serial => (
                                                <div key={serial} className="px-4 py-2 hover:bg-gray-100">
                                                    {serial}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-2 cursor-pointer" onClick={() => toggleDropdown(key)}>
                                    {end}
                                </td>
                                <td className="px-4 py-2">{count}</td>
                                <td className="px-4 py-2">{new Date(drawDate).toLocaleDateString()}</td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => handleUpdateTicket(key)}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm mr-2"
                                    >
                                        Update
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTicket(identifier)}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <BillingModal isOpen={isBillingModalOpen} onClose={closeBillingModal} />
        </div>
    );
};

const InputField = React.forwardRef(({ label, type = "text", value, onChange, onEnterPress }, ref) => (
    <div className="mb-4">
        <label className="block mb-2 font-bold text-gray-700">{label}:</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onEnterPress();
                }
            }}
            ref={ref}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
));

export default LotteryTicketGenerator;