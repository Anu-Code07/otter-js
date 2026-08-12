import { ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsRoot = path.join(__dirname, '../dist/assets');

export function registerAssetsIpc(): void {
  ipcMain.on('assets:resolve-sync', (event, relativePath: string) => {
    event.returnValue = pathToFileURL(path.join(assetsRoot, relativePath)).href;
  });
}
