import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

let mainWindow;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:5173'
            : `file://${path.join(__dirname, 'dist/index.html')}`
    );

    mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('print-to-pdf', (event) => {
    const pdfPath = path.join(app.getPath('temp'), 'print.pdf');
    const win = BrowserWindow.fromWebContents(event.sender);

    win.webContents.printToPDF({}).then(data => {
        require('fs').writeFile(pdfPath, data, (error) => {
            if (error) throw error;
            win.webContents.print({ silent: true, printBackground: true, deviceName: '' });
        });
    }).catch(error => {
        console.log(error);
    });
});