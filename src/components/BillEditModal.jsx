import React, { useState, useEffect } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

const BillEditModal = ({ isOpen, onClose, billData, onSave }) => {
    const [tickets, setTickets] = useState(billData?.tickets || []);

    useEffect(() => {
        setTickets(billData?.tickets || []);
    }, [billData]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleAddTicket = () => {
        setTickets([...tickets, '']);
    };

    const handleRemoveTicket = (index) => {
        const newTickets = tickets.filter((_, i) => i !== index);
        setTickets(newTickets);
    };

    const handleTicketChange = (index, value) => {
        const newTickets = [...tickets];
        newTickets[index] = value;
        setTickets(newTickets);
    };

    const handleSave = () => {
        const validTickets = tickets.filter(ticket => ticket.trim() !== '');
        onSave({ ...billData, tickets: validTickets });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">Edit Bill Details</h2>
                </div>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="text-sm font-medium">Bill Number</label>
                            <p className="text-gray-700">{billData?.billno}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Buyer Name</label>
                            <p className="text-gray-700">{billData?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Date</label>
                            <p className="text-gray-700">{billData?.date}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Total Amount</label>
                            <p className="text-gray-700">{billData?.totalAmount}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-lg font-medium">Tickets</label>
                            <button onClick={handleAddTicket} className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                                <FiPlus className="w-4 h-4" />
                                Add Ticket
                            </button>
                        </div>

                        <div className="space-y-2">
                            {tickets.map((ticket, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={ticket}
                                        onChange={(e) => handleTicketChange(index, e.target.value)}
                                        placeholder="Enter ticket details"
                                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button onClick={() => handleRemoveTicket(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                                        <FiX className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillEditModal;