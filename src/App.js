/*
 * @Author: greatpie
 * @Date: 2021-07-08 06:00:46
 * @LastEditTime: 2021-07-13 21:29:15
 * @LastEditors: greatpie
 * @FilePath: /alanysis-tool-electron/src/App.js
 */
import React, { useState } from 'react'

import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Container, AppBar, Tabs, Tab, Typography, Box } from '@material-ui/core'


import TabOne from './TabOne'
import { StatContext } from './content-manager'
import TabTwo from './TabTwo'


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.primary,
  },
  customForm: {
    textAlign: 'center',
    '& > *': {
      margin: theme.spacing(1),
      // width: '18ch',
    },
  },
  inputVaules: {
    marginBottom: theme.spacing(2),
  },
  submitBtns: {
    margin: theme.spacing(2)
  }
}));


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {/* {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )} */}
      <Box p={3}>
        <Typography>{children}</Typography>
      </Box>
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}
export default function App() {
  const classes = useStyles()
  const [value, setValue] = useState(0)
  const handleChange = (event, newValue) => {
    setValue(newValue)
  }


  const [stdRatio,setStdRatio] = useState(1)
  const [params,setParams] = useState({
    'gradient':1,
    'intercept':1,
    'R_square':0,
  })
  return (
    <StatContext.Provider value={{ params, setParams, stdRatio, setStdRatio}}>
      <div className={classes.root}>
        <Container maxWidth="md">
          <AppBar position="static">
            <Tabs value={value} onChange={handleChange} aria-label="simple tabs">
              <Tab label="标准曲线分析" {...a11yProps(0)} />
              <Tab label="定量分析" {...a11yProps(1)} />

            </Tabs>
          </AppBar>
          <TabPanel value={value} index={0}>
            <TabOne></TabOne>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <TabTwo></TabTwo>
          </TabPanel>
        </Container>

      </div></StatContext.Provider>

  );
}

