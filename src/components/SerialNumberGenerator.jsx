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

    return (
        <div className="max-w-md mx-auto mt-8 p-4 bg-gray-100 rounded-lg">
            {/* <h2 className="text-2xl mb-4">Lottery Ticket Generator</h2> */}
            <div className="mb-4">
                <label className="block mb-2">First Serial Number:</label>
                <input
                    type="text"
                    value={firstSerial}
                    onChange={(e) => setFirstSerial(e.target.value.toUpperCase().substring(0, 2))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-2">Last Serial Number:</label>
                <input
                    type="text"
                    value={lastSerial}
                    onChange={(e) => setLastSerial(e.target.value.toUpperCase().substring(0, 2))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-2">First Ticket Number:</label>
                <input
                    type="number"
                    value={firstNumber}
                    onChange={(e) => setFirstNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-2">Last Ticket Number:</label>
                <input
                    type="number"
                    value={lastNumber}
                    onChange={(e) => setLastNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
            </div>
            <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
                onClick={handleGenerate}
            >
                Generate
            </button>
            <div className="mt-4">
                <h3 className="text-xl mb-2">Generated Lottery Tickets</h3>
                <ul>
                    {lotteryTickets.map((ticket, index) => (
                        <li key={index}>Serial: {ticket.serial}, Number: {ticket.number}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default LotteryTicketGenerator;