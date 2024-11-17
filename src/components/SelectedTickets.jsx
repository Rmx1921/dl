import { useMemo } from "react";
import { formatDate } from '../utils/fortmatDate'
import { X } from 'lucide-react'

const SelectedTickets = ({ tickets, onRemove }) => {
    const summaryGroups = useMemo(() => {
        const groups = {};

        Array.from(tickets).forEach(ticket => {
            const [startSerial, endSerial, , , ticketname] = ticket.identifier.split('-');
            const key = `${startSerial}-${endSerial}-${ticketname}`;

            if (!groups[key]) {
                groups[key] = {
                    serials: new Set(),
                    numbers: new Set(),
                    ticketname,
                    drawDate: ticket.drawDate,
                    tickets: []
                };
            }

            groups[key].serials.add(ticket.serial);
            groups[key].numbers.add(ticket.number);
            groups[key].tickets.push(ticket);
        });

        return Object.entries(groups).map(([key, group]) => {
            const serialArray = Array.from(group.serials).sort();
            const numberArray = Array.from(group.numbers).sort((a, b) => a - b);

            const serialRanges = [];
            let start = serialArray[0];
            let prev = start;

            for (let i = 1; i <= serialArray.length; i++) {
                if (i === serialArray.length || serialArray[i].charCodeAt(0) - prev.charCodeAt(0) > 1) {
                    serialRanges.push(start === prev ? start : `${start}-${prev}`);
                    if (i < serialArray.length) {
                        start = serialArray[i];
                        prev = start;
                    }
                } else {
                    prev = serialArray[i];
                }
            }

            return {
                ticketname: group.ticketname,
                drawDate: formatDate(group.drawDate),
                serials: serialRanges.join(', '),
                numbers: `${numberArray[0]}-${numberArray[numberArray.length - 1]}`,
                count: numberArray.length,
                tickets: group.tickets
            };
        });
    }, [tickets]);

    const handleRemoveGroup = (groupTickets) => {
        if (onRemove) {
            onRemove(groupTickets);
        }
    };

    return (
        <div className="h-full w-full">
            <h2 className="text-lg font-bold mb-1">Selected Tickets</h2>
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                {summaryGroups.map((group, index) => (
                    <div key={index} className="p-3 bg-gray-50 border border-black relative group">
                        <button
                            onClick={() => handleRemoveGroup(group.tickets)}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove tickets"
                        >
                            <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                        </button>
                        <div className="font-medium text-gray-800">{group.ticketname}</div>
                        <div className="mt-1 text-sm">
                            <div>Series: {group.serials}</div>
                            <div>{group.numbers}</div>
                        </div>
                    </div>
                ))}
            </div>
            {summaryGroups.length === 0 && (
                <div className="text-gray-500 text-center mt-4">
                    No tickets selected
                </div>
            )}
        </div>
    );
};

export default SelectedTickets;