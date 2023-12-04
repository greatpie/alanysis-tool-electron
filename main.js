/*
 * @Author: greatpie
 * @Date: 2021-07-09 20:07:41
 * @LastEditTime: 2021-07-13 21:09:48
 * @LastEditors: greatpie
 * @FilePath: /alanysis-tool-electron/main.js
 */
const { app, BrowserWindow,Menu} = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
require('@electron/remote/main').initialize()

const log = require('electron-log')
// Optional, initialize the logger for any renderer process
log.initialize({ preload: true })
log.info('Log from the main process')

let mainWindow;

app.on('ready', () => {
    Menu.setApplicationMenu(null)
    mainWindow = new BrowserWindow({
        title:'Analysis Tool',
        width: 1024,
        height: 680,
        // frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, "./build/index.html")}`

    if(isDev){
        mainWindow.webContents.openDevTools()
    }
    mainWindow.loadURL(urlLocation)
    
})

app.on('window-all-closed', (evt) => {
    app.quit()
})