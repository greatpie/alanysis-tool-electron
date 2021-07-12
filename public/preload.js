/*
 * @Author: greatpie
 * @Date: 2021-07-09 21:00:09
 * @LastEditTime: 2021-07-09 22:11:38
 * @LastEditors: greatpie
 * @FilePath: /create-react-app/preload.js
 */
global.electron = require('electron')
window.ipcRenderer = require('electron').ipcRenderer
window.remote = require('@electron/remote')