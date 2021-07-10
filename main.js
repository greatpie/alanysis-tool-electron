/*
 * @Author: greatpie
 * @Date: 2021-07-09 20:07:41
 * @LastEditTime: 2021-07-09 22:11:13
 * @LastEditors: greatpie
 * @FilePath: /create-react-app/main.js
 */
const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
require('@electron/remote/main').initialize()

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        title:'Analysis Tool',
        width: 1024,
        height: 680,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
    mainWindow.loadURL(urlLocation)
    mainWindow.webContents.openDevTools()
})
