const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const url = require('url');
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
const log = require('electron-log');

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
        pathname: path.join(__dirname, './dist/index.html'),
        protocol: 'file:',
        slashes: true
    });
    log.info(`Start URL: ${startUrl}`);
    mainWindow.loadFile(path.join(__dirname, './dist/index.html')).catch(err => {
        log.error('Failed to load app:', err);
        app.quit();
    });
}

function createWindow() {
    log.info('Creating main window...');
    const preloadPath = path.join(__dirname, 'preload.js');
    log.info(`Preload path: ${preloadPath}`);

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
    log.info('Main window created');

    const startUrl = url.format({
        pathname: path.join(__dirname, 'dist', 'index.html'),
        protocol: 'file:',
        slashes: true
    });
    log.info(`Start URL: ${startUrl}`);

    if (isDev) {
        log.info('Loading development URL...');
        mainWindow.loadURL('http://localhost:5173').catch(err => {
            log.error('Failed to load dev server:', err);
            loadProductionBuild(mainWindow);
        });
        mainWindow.webContents.openDevTools();
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