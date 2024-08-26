const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),
  onPrintReply: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('print-reply', callback);
      return () => ipcRenderer.removeListener('print-reply', callback);
    }
    return () => {};
  }
});

console.log('Preload script executed, electronAPI exposed');