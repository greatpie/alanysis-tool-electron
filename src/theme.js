/*
 * @Author: greatpie
 * @Date: 2021-07-08 06:00:46
 * @LastEditTime: 2021-07-12 10:29:11
 * @LastEditors: greatpie
 * @FilePath: /alanysis-tool-electron/src/theme.js
 */
import { red } from '@material-ui/core/colors';
import { createTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
});

export default theme;
 