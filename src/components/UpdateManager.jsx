import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Download, RefreshCw, Check, X } from 'lucide-react';

const UpdateManager = () => {
    const [updateStatus, setUpdateStatus] = useState('idle');
    const [updateInfo, setUpdateInfo] = useState(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('UpdateManager component mounted'); 

        const removers = [
            window.electronAPI.onUpdateChecking(() => {
                console.log('Checking for updates...');
                setUpdateStatus('checking');
                setError(null);
            }),

            window.electronAPI.onUpdateAvailable((info) => {
                console.log('Update available:', info);
                setUpdateStatus('available');
                setUpdateInfo(info);
                setError(null);
            }),

            window.electronAPI.onUpdateNotAvailable(() => {
                console.log('No updates available');
                setUpdateStatus('not-available');
                setError(null);
            }),

            window.electronAPI.onUpdateError((err) => {
                console.error('Update error:', err);
                setUpdateStatus('error');
                setError(err);
            }),

            window.electronAPI.onUpdateProgress((progressObj) => {
                console.log('Downloading update:', progressObj);
                setUpdateStatus('downloading');
                setProgress(progressObj.percent);
            }),

            window.electronAPI.onUpdateDownloaded(() => {
                console.log('Update downloaded');
                setUpdateStatus('downloaded');
            })
        ];

        return () => {
            console.log('Cleaning up listeners');
            removers.forEach(remove => remove());
        };
    }, []);

    const checkForUpdates = async () => {
        try {
            console.log('Checking for updates...');
            await window.electronAPI.checkForUpdates();
        } catch (err) {
            console.error('Error checking for updates:', err);
            setError(err.message);
        }
    };

    const downloadUpdate = async () => {
        try {
            console.log('Starting update download...');
            await window.electronAPI.startUpdateDownload();
        } catch (err) {
            console.error('Error downloading update:', err);
            setError(err.message);
        }
    };

    const installUpdate = () => {
        console.log('Installing update...');
        window.electronAPI.quitAndInstall();
    };

    console.log('Rendering UpdateManager with status:', updateStatus);

    return (
        <div className="fixed bottom-4 right-4 max-w-sm">
            <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                    <RefreshCw className="text-gray-500" size={20} />
                    <div className="flex-1">
                        <p className="text-sm">Current Status: {updateStatus}</p>
                    </div>
                    <button
                        onClick={checkForUpdates}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
                {updateStatus === 'available' && (
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="text-blue-500" size={20} />
                        <div className="flex-1">
                            <h3 className="font-medium">Update Available</h3>
                            <p className="text-sm text-gray-500">
                                Version {updateInfo?.version} is available to download
                            </p>
                        </div>
                        <button
                            onClick={downloadUpdate}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                )}

                {updateStatus === 'checking' && (
                    <div className="flex items-center space-x-3">
                        <RefreshCw className="text-gray-500 animate-spin" size={20} />
                        <div className="flex-1">
                            <p className="text-sm">Checking for updates...</p>
                        </div>
                    </div>
                )}

                {updateStatus === 'downloading' && (
                    <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                            <Download className="text-blue-500" size={20} />
                            <div className="flex-1">
                                <p className="text-sm">Downloading update...</p>
                            </div>
                            <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {updateStatus === 'downloaded' && (
                    <div className="flex items-center space-x-3">
                        <Check className="text-green-500" size={20} />
                        <div className="flex-1">
                            <h3 className="font-medium">Update Ready</h3>
                            <p className="text-sm text-gray-500">
                                Restart to install the update
                            </p>
                        </div>
                        <button
                            onClick={installUpdate}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                            Restart
                        </button>
                    </div>
                )}

                {updateStatus === 'error' && (
                    <div className="flex items-center space-x-3">
                        <X className="text-red-500" size={20} />
                        <div className="flex-1">
                            <h3 className="font-medium text-red-500">Update Error</h3>
                            <p className="text-sm text-gray-500">{error}</p>
                        </div>
                        <button
                            onClick={checkForUpdates}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateManager;