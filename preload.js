const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printToPDF: () => ipcRenderer.invoke('printToPDF'),
  onPrintReply: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('print-reply', callback);
      return () => ipcRenderer.removeListener('print-reply', callback);
    }
    return () => {};
  }
});

console.log('Preload script executed, electronAPI exposed');