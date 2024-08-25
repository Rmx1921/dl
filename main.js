const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const url = require('url');
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            sandbox: true
        },
    });

    const startUrl = url.format({
        pathname: path.join(__dirname, 'dist', 'index.html'),
        protocol: 'file:',
        slashes: true
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(startUrl);
    }

    mainWindow.webContents.openDevTools();

    mainWindow.on('close', (e) => {
        if (process.env.NODE_ENV === 'development') {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    ipcMain.handle('print', async (event) => {
        console.log('Print IPC handler called in main process');
        const win = BrowserWindow.fromWebContents(event.sender);
        try {
            const printOptions = {
                silent: false,
                printBackground: true,
                color: true,
                margin: {
                    marginType: 'printableArea'
                },
                landscape: false,
                pagesPerSheet: 1,
                collate: false,
                copies: 1,
                header: 'Page header',
                footer: 'Page footer'
            };

            win.webContents.print(printOptions, (success, failureReason) => {
                if (success) {
                    console.log('Print Initiated');
                    event.sender.send('print-reply', { success: true, message: 'Print Initiated' });
                } else {
                    console.error('Print Failed:', failureReason);
                    event.sender.send('print-reply', { success: false, error: failureReason });
                }
            });

            return { success: true, message: 'Print dialog opened' };
        } catch (error) {
            console.error('Printing failed:', error);
            console.error('Error stack:', error.stack);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('printToPDF', async (event) => {
        console.log('printToPDF handler called in main process');
        const win = BrowserWindow.fromWebContents(event.sender);
        try {
            const printOptions = {
                silent: false,
                printBackground: true,
                color: true,
                margin: {
                    marginType: 'printableArea'
                },
                landscape: false,
                pagesPerSheet: 1,
                collate: false,
                copies: 1,
                header: 'Page header',
                footer: 'Page footer'
            };

            win.webContents.print(printOptions, (success, failureReason) => {
                if (success) {
                    console.log('Print Initiated');
                    event.sender.send('print-reply', { success: true, message: 'Print Initiated' });
                } else {
                    console.error('Print Failed:', failureReason);
                    event.sender.send('print-reply', { success: false, error: failureReason });
                }
            });

            return { success: true, message: 'Print dialog opened' };
        } catch (error) {
            console.error('Printing failed:', error);
            console.error('Error stack:', error.stack);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('openPrintPreview', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win.webContents.printToPDF({}).then(data => {
            const path = require('path');
            const os = require('os');
            const fs = require('fs');
            const tempPath = path.join(os.tmpdir(), 'print-preview.pdf');
            fs.writeFileSync(tempPath, data);
            win.loadURL(`file://${tempPath}`);
        });
    });

    console.log('Print IPC handler registered');
}

app.whenReady().then(createWindow);

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});