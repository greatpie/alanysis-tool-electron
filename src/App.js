import React, { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import ecStat from 'echarts-stat'

import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Container, AppBar, Tabs, Tab, Typography, Box, Grid, Paper, TextField, Button, InputLabel, FormControl, Input } from '@material-ui/core'
import { divide, mean, std, abs, multiply } from 'mathjs'

// electron remote
const electron = window.require('electron');
const remote = electron.remote
const { dialog } = remote

const fs = window.require('fs/promises')
const path = window.require('path')

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
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
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

// DataForm
function DataForm(props) {
  const { index, className, da1, da2, ppm, stdRatio, statData, setStatData } = props

  const [concentration, setConcentration] = useState(0)
  const [fileName, setFileName] = useState('选择文件')
  const [rateMean, setRateMean] = useState(0)
  const [CV, setCV] = useState(0)
  function searchIntensity(da, dataList) {
    let intensity = 0
    let range = ppm / 1000000

    dataList.forEach(item => {
      let targetDa = item[0]
      if (targetDa >= da - range && targetDa <= da + range && intensity < item[1]) {
        intensity = item[1]
      }
    })
    return intensity
  }

  async function getRateMean(filePaths) {
    let taskList = []
    filePaths.forEach(filePath => {

      let task = fs.readFile(filePath, 'utf-8').then((content) => {
        let dataList = []
        let rate = 0
        content.split(/\r\n/).map(item => {
          dataList.push(item.split(/\s+/))
          return 0
        })

        let da1Intensity = searchIntensity(da1, dataList)
        let da2Intensity = searchIntensity(da2, dataList)
        if (da1Intensity > 0 && da2Intensity > 0) {
          rate = divide(da1Intensity, da2Intensity)
        }
        return rate
      })
      taskList.push(task)

    })

    await Promise.all(taskList).then((rateList) => {
      let rateStd = std(rateList)
      let rateMean = mean(rateList)
      let rateListFiltered = rateList.filter(rate => abs(rate - rateMean) <= multiply(rateStd, stdRatio))
      rateStd = std(rateListFiltered)
      rateMean = mean(rateListFiltered)
      let cv = divide(rateStd, rateMean)
      setRateMean(rateMean)
      setCV(cv)
      setStatData([...statData, [concentration, rateMean]])
      console.log(statData)
    })

  }
  function handleDataClick(e) {

    e.preventDefault()

    dialog.showOpenDialog({
      title: "请选择对应数据",
      filters: [
        { name: 'File Type', extensions: ['txt'] },
      ],
      properties: ['openFile', 'multiSelections']
    }).then(result => {
      if (!result.canceled) {
        const filePath = result.filePaths[0]
        setFileName(path.parse(filePath)['name'])
        getRateMean(result.filePaths)
        
      }

    }).catch(err => {
      console.log(err)
    })

  }
  return (<form key={index} className={className} noValidate autoComplete="off">
    <Grid container spacing={3}>
      <Grid item xs={3}><TextField className="concentration" label='浓度' value={concentration} onChange={e => setConcentration(e.target.value)} variant="outlined" />
      </Grid>
      <Grid item xs={3}><TextField className="data" label='数据' value={fileName} variant="outlined" onClick={handleDataClick} />
      </Grid>
      <Grid item xs={3}>
        <TextField className="rate" label='比值' value={rateMean} variant="outlined" /></Grid>
      <Grid item xs={3}>
        <TextField className="CV" label='CV' value={CV} variant="outlined" /></Grid>
    </Grid>
  </form>)
}

function LinearChart(props) {
  const {statData} = props
  const [option,setOption] = useState({})
  function getOption() {
    
    let option = {
      dataset: [{
        source: statData
      }, {
        transform: {
          type: 'ecStat:regression'
          // 'linear' by default.
          // config: { method: 'linear', formulaOn: 'end'}
        }
      }],
      title: {
        text: 'Linear Regression',
        subtext: 'By ecStat.regression',
        sublink: 'https://github.com/ecomfe/echarts-stat',
        left: 'center'
      },
      legend: {
        bottom: 5
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      xAxis: {
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        },
      },
      yAxis: {
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        },
      },
      series: [{
        name: 'scatter',
        type: 'scatter'
      }, {
        name: 'line',
        type: 'line',
        datasetIndex: 1,
        symbolSize: 0.1,
        symbol: 'circle',
        label: { show: true, fontSize: 16 },
        labelLayout: { dx: -20 },
        encode: { label: 2, tooltip: 1 }
      }]
    };
    return option;
  }
  function getEcharts() {
    echarts.registerTransform(ecStat.transform.regression)
    return echarts
  }

  return (<ReactECharts
    option={getOption()}
    echarts={getEcharts()}
  />)
}

export default function App() {
  const classes = useStyles()
  const [value, setValue] = useState(0)
  const [da1, setDa1] = useState(0)
  const [da2, setDa2] = useState(0)
  const [ppm, setPpm] = useState(0)
  const [stdRatio, setStdRatio] = useState(1)
  const [statData, setStatData] = useState([])
  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <div className={classes.root}>
      <Container maxWidth="md">
        <AppBar position="static">
          <Tabs value={value} onChange={handleChange} aria-label="simple tabs">
            <Tab label="标准曲线分析" {...a11yProps(0)} />
            <Tab label="定量分析" {...a11yProps(1)} />

          </Tabs>
        </AppBar>
        <TabPanel value={value} index={0}>
          <div className={classes.inputVaules}>
            <form className={classes.customForm} noValidate autoComplete="off">
              <FormControl>
                <InputLabel htmlFor="da1">待测分子(Da)</InputLabel>
                <Input id="da1" value={da1} onChange={(e) => setDa1(e.target.value)} />
              </FormControl>
              <FormControl>
                <InputLabel htmlFor="da2">内/外标分子(Da)</InputLabel>
                <Input id="da2" value={da2} onChange={(e) => setDa2(e.target.value)} />
              </FormControl>
              <FormControl>
                <InputLabel htmlFor="ppm">质量精度(ppm)</InputLabel>
                <Input id="ppm" value={ppm} onChange={(e) => setPpm(e.target.value)} />
              </FormControl>
              <FormControl>
                <InputLabel htmlFor="stdRatio">标准差系数</InputLabel>
                <Input id="stdRatio" value={stdRatio} onChange={(e) => setStdRatio(e.target.value)} />
              </FormControl>
            </form>
          </div>


          <Grid container spacing={3}>
            <Grid item xs={3}>
              <Paper className={classes.paper}>浓度</Paper>

            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.paper}>数据</Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.paper}>比值</Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.paper}>CV</Paper>
            </Grid>
          </Grid>

          <container>
            {Array.from({ length: 10 }, (value, index) =>
              <DataForm index={index} className={classes.customForm} da1={da1} da2={da2} ppm={ppm} stdRatio={stdRatio} statData={statData} setStatData={setStatData}></DataForm>
            )}
          </container>



          <Grid container spacing={3} className={classes.submitBtns}>
            <Grid item xs={3}>
              <Button variant="contained" color="primary" size='large'>
                计  算
              </Button>
            </Grid>

            <Grid item xs={3}>
              <Button variant="contained" color="primary" size='large'>
                重  置
              </Button>
            </Grid>

          </Grid>


          <Paper square>
            <LinearChart statData={statData}></LinearChart>
          </Paper>

        </TabPanel>
        <TabPanel value={value} index={1}>
          定量分析
        </TabPanel>
      </Container>

    </div>
  );
}

