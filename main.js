import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import url from 'url';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.info('Application Starting...');
log.info(`Running in ${isDev ? 'development' : 'production'} mode`);

function simplifiedMonitorPrintJob(jobId) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 0.1;
        log.info(`Estimated print progress: ${Math.min(progress * 100, 100).toFixed(1)}%`);
        if (progress >= 1) {
            clearInterval(interval);
            log.info('Estimated print completion');
            ipcMain.emit('print-completed', { jobId, estimated: true });
        }
    }, 1000);
    const estimatedPrintTime = 18000 + Math.random() * 18000;
    setTimeout(() => {
        clearInterval(interval);
        log.info('Print job likely completed');
        ipcMain.emit('print-completed', { jobId, estimated: false });
    }, estimatedPrintTime);
}

function loadProductionBuild(mainWindow) {
    log.info('Loading production build...');
    const startUrl = url.format({
        pathname: path.join(__dirname, 'dist', 'index.html'),
        protocol: 'file:',
        slashes: true
    });
    log.info(`Start URL: ${startUrl}`);
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
        log.error('Failed to load app:', err);
        app.quit();
    });
}

let mainWindow;

async function waitForViteServer(mainWindow, retries = 30, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            await mainWindow.loadURL('http://localhost:5173');
            log.info('Successfully connected to Vite dev server');
            return;
        } catch (err) {
            log.info(`Failed to connect to Vite dev server. Attempt ${i + 1}/${retries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Failed to connect to Vite dev server after multiple attempts');
}

function createWindow() {
    log.info('Creating main window...');
    const preloadPath = path.join(__dirname, 'preload.js');
    log.info(`Preload path: ${preloadPath}`);

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
            sandbox: true,
            webSecurity: !isDev,
            devTools: true
        },
    });
    log.info('Main window created');

    if (isDev) {
        log.info('Attempting to connect to development server...');
        waitForViteServer(mainWindow)
            .then(() => {
                log.info('Development server connected, opening DevTools');
                mainWindow.webContents.openDevTools();
                if (process.env.REACT_DEVTOOLS_PATH) {
                    BrowserWindow.addDevToolsExtension(process.env.REACT_DEVTOOLS_PATH);
                }
            })
            .catch(err => {
                log.error('Failed to load dev server:', err);
                loadProductionBuild(mainWindow);
            });
    } else {
        loadProductionBuild(mainWindow);
    }

    mainWindow.webContents.on('did-finish-load', () => {
        log.info('Main window finished loading');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        log.error('Page failed to load:', errorCode, errorDescription);
    });

    mainWindow.on('close', (e) => {
        if (isDev) {
            log.info('Preventing window close in development mode');
            e.preventDefault();
            mainWindow.hide();
        }
    });

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update-available');
    });

    autoUpdater.on('update-downloaded', () => {
        mainWindow.webContents.send('update-downloaded');
    });

    ipcMain.on('quit-and-install', () => {
        autoUpdater.quitAndInstall();
    });

    ipcMain.handle('print', async (event) => {
        log.info('Print request received');
        const win = BrowserWindow.fromWebContents(event.sender);
        return new Promise((resolve) => {
            const printOptions = {
                silent: true,
                printBackground: true,
                color: false,
                margin: { marginType: 'none' },
                landscape: false,
                pagesPerSheet: 1,
                collate: false,
                copies: 1,
                header: '',
                footer: ''
            };
            win.webContents.print(printOptions, (success, failureReason) => {
                if (success) {
                    const jobId = Date.now();
                    log.info(`Print job initiated with ID: ${jobId}`);
                    simplifiedMonitorPrintJob(jobId);
                    resolve({ success: true, jobId, message: 'Print Initiated' });
                } else {
                    log.error(`Print failed: ${failureReason}`);
                    resolve({ success: false, message: failureReason });
                }
            });
        });
    });

    ipcMain.handle('print-to-pdf', async (event, options) => {
        log.info('Print to PDF request received');
        try {
            const win = BrowserWindow.fromWebContents(event.sender);
            const pdfPath = path.join(app.getPath('downloads'), options.fileName || 'print.pdf');
            log.info(`Printing to PDF: ${pdfPath}`);
            const data = await win.webContents.printToPDF({});
            await fs.writeFile(pdfPath, data);
            log.info('PDF created successfully');
            return { success: true, message: `Printed to: ${pdfPath}` };
        } catch (error) {
            log.error('Printing to PDF failed:', error);
            return { success: false, error: error.message };
        }
    });
}

const customMenu = [
    {
        label: 'File',
        submenu: [
            { role: 'close' },
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: () => {
                    if (mainWindow && mainWindow.webContents) {
                        mainWindow.webContents.reload();
                    } else {
                        console.error('Main window or webContents not defined.');
                    }
                }
            }
        ]
    },
    {
        label: 'Bills',
        submenu: [
            {
                label: 'Open Bills Page',
                click: () => {
                    if (mainWindow && mainWindow.webContents) {
                        mainWindow.webContents.send('open-bills-page');
                    } else {
                        console.error('Main window or webContents not defined.');
                    }
                }
            }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Check for Updates',
                click: () => {
                    mainWindow.webContents.send('check-for-updates');
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(customMenu);
Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
    log.info('App is ready, creating window...');
    createWindow();
});

app.on('activate', () => {
    log.info('App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
        log.info('No windows found, creating new window');
        createWindow();
    }
});

app.on('window-all-closed', () => {
    log.info('All windows closed');
    if (process.platform !== 'darwin') {
        log.info('Quitting app');
        app.quit();
    }
});

process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    app.quit();
});

app.allowRendererProcessReuse = true;