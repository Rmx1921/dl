import React, { useState } from 'react';
import { toast } from 'react-toastify';

const PasswordScreen = ({ onPasswordCorrect }) => {
    const [password, setPassword] = useState('');
    const correctPassword = process.env.REACT_APP_PASSWORD; // Make sure to add REACT_APP_PASSWORD in your .env file

    const handlePasswordSubmit = () => {
        if (password === correctPassword) {
            onPasswordCorrect();
        } else {
            toast.error('Incorrect password. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-6 bg-white rounded shadow-md">
                <h2 className="mb-4 text-2xl font-bold text-center">Enter Password</h2>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handlePasswordSubmit();
                        }
                    }}
                    className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Password"
                />
                <button
                    onClick={handlePasswordSubmit}
                    className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default PasswordScreen;