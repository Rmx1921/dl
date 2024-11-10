import React, { useState, useEffect, useRef } from 'react';
import { saveTicketsToDB, getAllTicketsFromDB, updateTicketInDB, deleteTicketFromDB } from '../components/helpers/indexdb'
import { toast } from 'react-toastify';
import BillingModal from './BillingModal';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaEdit, FaTrash} from 'react-icons/fa';

class Lottery {
    constructor(serial, number, ticketname, serialNumber, state, drawDate, identifier,date) {
        this.id = `${serial}-${number}`;
        this.serial = serial;
        this.number = number;
        this.ticketname = ticketname;
        this.serialNumber = serialNumber;
        this.state = state;
        this.drawDate = drawDate;
        this.identifier = identifier;
        this.date= date
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
                ticket_arr.push(new Lottery(temp_first_lott_ser, temp_first_lottery_num, ticketname, serialNumber, true, drawDate, identifier,new Date()));
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
    const [ticketname, setTicketName] = useState('');
    const dropdownRefs = useRef({});
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [drawDate, setDrawDate] = useState(new Date());

    const inputRefs = useRef([]);

    function formatDate(date) {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }

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
        const newTickets = generateLotteryTickets(firstSerial, lastSerial, firstNum, lastNum, ticketname.toLocaleUpperCase(), serialNumber, drawDate);
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
            toast.error('Some tickets are already existing in the specified range');
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
                    identifier: ticket.identifier,
                    unsoldCount: ticket.state ? 1 : 0
                };
            } else {
                ticketSummary[key].end = serialNumber;
                ticketSummary[key].count += 1;
                ticketSummary[key].serials.push(serialNumber);
                if (ticket.state) {
                    ticketSummary[key].unsoldCount += 1;
                }
            }
        });

        return ticketSummary;
    };

    return (
        <div className="flex flex-col w-full min-h-screen p-8 bg-[#f0f0f0]">
            <div className="bg-white p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField label="First Serial" value={firstSerial} onChange={(e) => setFirstSerial(e.target.value.toUpperCase().substring(0, 2))} />
                    <InputField label="Last Serial" value={lastSerial} onChange={(e) => setLastSerial(e.target.value.toUpperCase().substring(0, 2))} />
                    <InputField label="First Ticket Number" type="number" value={firstNumber} onChange={(e) => setFirstNumber(e.target.value)} />
                    <InputField label="Last Ticket Number" type="number" value={lastNumber} onChange={(e) => setLastNumber(e.target.value)} />
                    <InputField label="Lottery Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                    <InputField label="Ticket Name" value={ticketname} onChange={(e) => setTicketName(e.target.value)} />
                    <div className="mb-4">
                        <label className="block mb-2 font-bold text-gray-700">Draw Date:</label>
                        <DatePicker
                            selected={drawDate}
                            onChange={date => setDrawDate(date)}
                            className="w-full px-4 py-2 border border-gray-300"
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                    <button
                        onClick={handleGenerate}
                        className="bg-[#007bff] hover:bg-[#0056b3] text-white font-bold py-2 px-4"
                    >
                        Save
                    </button>
                    <button
                        onClick={openBillingModal}
                        className="bg-[#6c757d] hover:bg-[#545b62] text-white font-bold py-2 px-4"
                    >
                        Billing
                    </button>
                </div>
            </div>
            <div className="bg-white p-6 mt-8">
                <h2 className="text-xl font-bold mb-4">Tickets</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#e9ecef]">
                                <th className="px-4 py-2 text-left">Ticket Name</th>
                                <th className="px-4 py-2 text-left">Start Serial</th>
                                <th className="px-4 py-2 text-left">End Serial</th>
                                <th className="px-4 py-2 text-left">Count</th>
                                <th className='px-4 py-2 text-left'>unsold tickets</th>
                                <th className="px-4 py-2 text-left">Draw Date</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(TicketsByPrefix()).sort(([, a], [, b]) => b.date - a.date).map(([key, { start, end, count, serials, ticketname, drawDate, identifier, unsoldCount }]) => (
                                <tr key={key} className={`border-t border-[#5e5f5f]`}>
                                    <td className="px-4 py-2">{ticketname}</td>
                                    <td className="px-4 py-2">{start}</td>
                                    <td className="px-4 py-2">{end}</td>
                                    <td className="px-4 py-2">{count}</td>
                                    {unsoldCount === 0 ? (
                                        <td className="px-4 py-2">sold out</td>
                                    ):(
                                        <td className="px-4 py-2">{unsoldCount}</td>
                                    )}
                                    <td className="px-4 py-2">{formatDate(drawDate)}</td>
                                    <td className="px-4 py-2 flex items-center space-x-2">
                                        {/* <button
                                            onClick={() => handleUpdateTicket(key)}
                                            className="bg-[#007bff] hover:bg-[#0056b3] text-white font-bold py-1 px-2 rounded text-sm"
                                        >
                                            <FaEdit />
                                        </button> */}
                                        {unsoldCount !== 0 && (
                                            <button
                                                onClick={() => handleDeleteTicket(identifier)}
                                                className="bg-[#dc3545] hover:bg-[#c82333] text-white font-bold py-1 px-2 rounded text-sm"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <BillingModal isOpen={isBillingModalOpen} onClose={closeBillingModal} />
        </div>
    );
};

const InputField = React.forwardRef(({ label, type = "text", value, onChange }, ref) => (
    <div className="mb-4">
        <label className="block mb-2 font-bold text-gray-700">{label}:</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            ref={ref}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007bff]"
        />
    </div>
));

export default LotteryTicketGenerator;