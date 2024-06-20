<div className="max-w-md mx-auto mt-8 p-4 bg-gray-100 rounded-lg">
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
        <table className="w-full border-collapse border border-gray-400">
            <thead>
                <tr>
                    <th className="border border-gray-400 px-4 py-2">Prefix</th>
                    <th className="border border-gray-400 px-4 py-2">Start Serial</th>
                    <th className="border border-gray-400 px-4 py-2">End Serial</th>
                    <th className="border border-gray-400 px-4 py-2">Count</th>
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