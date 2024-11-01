import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, Check, AlertCircle } from 'lucide-react';
import { getAllBillData } from './helpers/billsdb';

const DataExport = () => {
    const [loading, setLoading] = useState(false);
    const [exportStatus, setExportStatus] = useState({
        success: false,
        error: false,
        message: ''
    });

    const handleExport = async () => {
        setLoading(true);
        setExportStatus({ success: false, error: false, message: '' });
        try {
            let data = await getAllBillData();
            const jsonData = JSON.stringify(data, null, 2);
             console.log(jsonData)
            setExportStatus({
                success: true,
                error: false,
                message: `Bill data exported successfully`
            });
        } catch (error) {
            setExportStatus({
                success: false,
                error: true,
                message: `Failed to export.`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Export Bill Data</h2>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'cursor-not-allowed' : ''}`}
                            onClick={handleExport}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-5 h-5 mr-2" />
                            )}
                            {loading ? 'Exporting...' : 'Export Bills'}
                        </button>
                    </div>

                    {exportStatus.success && (
                        <div className="flex items-start p-4 rounded-md bg-green-50 border border-green-200">
                            <Check className="h-4 w-4 text-green-600 mt-1 mr-2" />
                            <div>
                                <h4 className="font-medium text-green-800">Success</h4>
                                <p className="text-green-700">{exportStatus.message}</p>
                            </div>
                        </div>
                    )}

                    {exportStatus.error && (
                        <div className="flex items-start p-4 rounded-md bg-red-50 border border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-1 mr-2" />
                            <div>
                                <h4 className="font-medium text-red-800">Error</h4>
                                <p className="text-red-700">{exportStatus.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataExport;