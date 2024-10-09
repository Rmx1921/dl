const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const url = require('url');
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');  // Preload path consolidated

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
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

    mainWindow.on('close', (e) => {
        if (process.env.NODE_ENV === 'development') {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    ipcMain.handle('print', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        return new Promise((resolve) => {
            const printOptions = {
                silent: true,
                printBackground: true,
                color: true,
                margin: { marginType: 'printableArea' },
                landscape: false,
                pagesPerSheet: 1,
                collate: false,
                copies: 1,
                header: 'Page header',
                footer: 'Page footer'
            };
            win.webContents.print(printOptions, (success, failureReason) => {
                resolve({ success, message: success ? 'Print Initiated' : failureReason });
            });
        });
    });

    ipcMain.handle('printToPDF', async (event, options) => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            const pdfPath = path.join(app.getPath('downloads'), options.fileName || 'print.pdf');
            const data = await win.webContents.printToPDF({});
            await fs.writeFile(pdfPath, data);
            return { success: true, message: `Printed to: ${pdfPath}` };
        } catch (error) {
            console.error('Printing failed:', error);
            return { success: false, error: error.message };
        }
    });
}

app.whenReady().then(createWindow);

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.allowRendererProcessReuse = true;