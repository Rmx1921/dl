const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),
  print: () => ipcRenderer.invoke('print'),
  onPrintReply: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('print-reply', callback);
      return () => ipcRenderer.removeListener('print-reply', callback);
    }
    return () => { };
  },
  getData: () => ipcRenderer.invoke('get-data'),
  onDataUpdate: (callback) => {
    const channel = 'data-update';
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
    return () => ipcRenderer.removeListener(channel, callback);
  }
});
window.addEventListener('DOMContentLoaded', () => {
  // heavy initialization area
});