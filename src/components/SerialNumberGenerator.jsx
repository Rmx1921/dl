import React, { useState } from 'react';

class Lottery {
    constructor(serial, number) {
        this.serial = serial;
        this.number = number;
    }
}

const generateLotteryTickets = (firstSerial, lastSerial, firstNumber, lastNumber) => {
    const ticket_arr = [];
    let temp_first_lott_ser = firstSerial;
    let temp_first_lottery_num = firstNumber;
    const alphabet_limit = (lastSerial.charCodeAt(1) - firstSerial.charCodeAt(1)) + 1;

    for (let alphabet = 0; alphabet < alphabet_limit; alphabet++) {
        if (temp_first_lott_ser[1] !== 'I' && temp_first_lott_ser[1] !== 'Q') {
            for (let num = 0; num < 25; num++) {
                ticket_arr.push(new Lottery(temp_first_lott_ser, temp_first_lottery_num));
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
    const [lotteryTickets, setLotteryTickets] = useState([]);

    const handleGenerate = () => {
        const firstNum = parseInt(firstNumber, 10);
        const lastNum = parseInt(lastNumber, 10);
        const tickets = generateLotteryTickets(firstSerial, lastSerial, firstNum, lastNum);
        setLotteryTickets(tickets);
    };

    const summarizeTicketsByPrefix = () => {
        const ticketSummary = {};
        lotteryTickets.forEach(ticket => {
            const prefix = ticket.serial.substring(0, 2);
            if (!ticketSummary[prefix]) {
                ticketSummary[prefix] = {
                    start: ticket.serial + ticket.number.toString(),
                    end: ticket.serial + ticket.number.toString(),
                    count: 0
                };
            }
            ticketSummary[prefix].end = ticket.serial + ticket.number.toString();
            ticketSummary[prefix].count += 1;
        });
        return ticketSummary;
    };

    const ticketSummary = summarizeTicketsByPrefix();

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
                <div className="mt-7">
                    <button
                        onClick={handleGenerate}
                        className="w-28 h-12 bg-gradient-to-r from-emerald-400 to-cyan-400"
                    >
                        Generate
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border bg-white rounded-lg border-gray-400">
                    <thead>
                        <tr>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Start Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">End Serial</th>
                            <th className="border border-gray-400 px-4 py-2 bg-gray-200">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(ticketSummary).map(([prefix, { start, end, count }]) => (
                            <tr key={prefix}>
                                <td className="border border-gray-400 px-4 py-2">{prefix}</td>
                                <td className="border border-gray-400 px-4 py-2">{start}</td>
                                <td className="border border-gray-400 px-4 py-2">{end}</td>
                                <td className="border border-gray-400 px-4 py-2">{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LotteryTicketGenerator;