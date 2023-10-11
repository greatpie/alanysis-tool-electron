import React, { useState, useContext } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import ecStat from 'echarts-stat'
import { makeStyles } from '@material-ui/core/styles'
import { Container, Grid, Paper, TextField, Button, InputLabel, FormControl, Input } from '@material-ui/core'
import { divide, mean, std, abs, multiply, square } from 'mathjs'
import { StatContext } from './content-manager'

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

// DataForm
function DataForm(props) {
    const { index, className, da1, da2, ppm, dilutionRatio, statObj, setStatObj } = props
    const [concentration, setConcentration] = useState(0)
    const [inputConcentration, setInputConcentration] = useState(0)
    const [relativeDeviation, setRelativeDeviation] = useState(0)
    const [fileName, setFileName] = useState('选择文件')
    const [rateMean, setRateMean] = useState(0)
    const [CV, setCV] = useState(0)
    const { params, stdRatio } = useContext(StatContext)
    function searchIntensity(da, dataList) {

        let range = multiply(divide(ppm, 1000000), da)
        let intensity = 0
        for (let item of dataList) {

            let targetDa = parseFloat(item[0])
            let targetIntensity = parseFloat(item[1])
            if (abs(targetDa - da) <= range && intensity <= targetIntensity) {
                intensity = targetIntensity
            }
        }
        return intensity.toFixed(2)
    }
    async function getRateMean(filePaths) {
        let taskList = []
        filePaths.forEach(filePath => {

            let task = fs.readFile(filePath, 'utf-8').then((content) => {
                let dataList = []
                let rate = 0
                content.split(/\r\n/).map(item => {
                    dataList.push(item.split(/\s+/))
                    return null
                })

                let da1Intensity = searchIntensity(da1, dataList)
                let da2Intensity = searchIntensity(da2, dataList)
                if (da1Intensity > 0 && da2Intensity > 0) {
                    rate = divide(da1Intensity, da2Intensity)
                }
                return rate.toFixed(2)
            })
            taskList.push(task)

        })

        await Promise.all(taskList).then((rateList) => {
            rateList = rateList.filter(rate => rate)
            if (rateList.length > 0) {
                let rateStd = std(rateList)
                let rateMean = mean(rateList)
                let rateListFiltered = rateList.filter(rate => abs(rate - rateMean) <= multiply(rateStd, stdRatio))
                rateStd = std(rateListFiltered)
                rateMean = mean(rateListFiltered)
                let cv = divide(rateStd, rateMean).toFixed(2)
                
             
                setRateMean(rateMean)
                setCV(cv)
                let concentration = ((params['gradient'] * rateMean + params['intercept']) * dilutionRatio).toFixed(2)
                setConcentration(concentration)
            }


        })

    }
    function handleInputConcChange(e) {
        e.preventDefault()
        let currentInputConc = e.target.value
        setInputConcentration(currentInputConc)

        setRelativeDeviation(divide(concentration - currentInputConc, currentInputConc))
        let dataRow = { [index]: [parseFloat(currentInputConc), parseFloat(concentration)] }
        setStatObj({ ...statObj, ...dataRow })
    }

    function handleKeyUp(e) {
        e.preventDefault()
        if (e.keyCode === 13) {
            let currentInputConc = e.target.value
            setInputConcentration(currentInputConc)
            setRelativeDeviation(divide(concentration - currentInputConc, currentInputConc))
            let dataRow = { [index]: [parseFloat(currentInputConc), parseFloat(concentration)] }
            setStatObj({ ...statObj, ...dataRow })
        }
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

            <Grid item xs={2}><TextField className="data" label='数据' value={fileName} variant="outlined" onClick={handleDataClick} />
            </Grid>
            <Grid item xs={2}>
                <TextField className="rate" label='比值' value={rateMean} variant="outlined" /></Grid>
            <Grid item xs={2}>
                <TextField className="CV" label='CV' value={CV} variant="outlined" /></Grid>
            <Grid item xs={2}><TextField label='实测浓度' value={concentration} variant="outlined" />
            </Grid>
            <Grid item xs={2}><TextField label='对标浓度' value={inputConcentration} onChange={handleInputConcChange} onKeyUp={handleKeyUp} variant="outlined" />
            </Grid>
            <Grid item xs={2}><TextField label='相对偏差' value={relativeDeviation} variant="outlined" />
            </Grid>
        </Grid>
    </form>)
}

function LinearChart(props) {
    const { statData, gradient, intercept, R_square } = props



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

    return (<Container>
        <Grid container spacing={3}>
            <Grid item xs={3}>
                <span>斜率：{gradient.toPrecision(5)}</span>
            </Grid>
            <Grid item xs={3}>
                <span>截距：{intercept.toPrecision(5)}</span>
            </Grid>
            <Grid item xs={3}>
                <span>R^2：{R_square.toPrecision(5)}</span>
            </Grid>

        </Grid>

        <ReactECharts
            option={getOption()}
            echarts={getEcharts()}
        /></Container>)
}

export default function TabTwo(props) {
    const classes = useStyles()
    const [da1, setDa1] = useState(0)
    const [da2, setDa2] = useState(0)
    const [ppm, setPpm] = useState(1000)
    const [dilutionRatio, setdilutionRatio] = useState(1)
    const [statData, setStatData] = useState([])
    const [statObj, setStatObj] = useState({})
    const { params, setParams } = useContext(StatContext)
    const [showCharts, setShowCharts] = useState(false)

    const [gradient2, setGradient2] = useState(0)
    const [intercept2, setintercept2] = useState(0)
    const [R_square2, setR_square2] = useState(0)

    const { doReset } = props


    function handleRefreshClick() {
        doReset()
    }

    function handleCaculateClick() {
        function getStatParam() {
            let statList = Object.values(statObj)

            setStatData(statList)

            if (statList.length > 0) {
                let myRegression = ecStat.regression('linear', statList)
                let gradient = myRegression.parameter['gradient']
                let intercept = myRegression.parameter['intercept']

                let y_matrix = []
                let f_matrix = []
                statList.forEach(item => {
                    let f = item[0] * gradient + intercept
                    y_matrix.push(item[1])
                    f_matrix.push(f)

                })
                let y_mean = mean(y_matrix)
                let SS_tot = 0
                let SS_res = 0
                for (let i = 0; i < y_matrix.length; i++) {
                    SS_tot += square(y_matrix[i] - y_mean)
                    SS_res += square(y_matrix[i] - f_matrix[i])
                }
                let R_square = 1 - divide(SS_res, SS_tot)

                setGradient2(gradient)
                setintercept2(intercept)
                setR_square2(R_square)
            }

        }
        getStatParam()
        setShowCharts(true)

    }

    return (

        <Container>
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
                        <InputLabel htmlFor="dilutionRatio">稀释倍数</InputLabel>
                        <Input id="dilutionRatio" value={dilutionRatio} onChange={(e) => setdilutionRatio(e.target.value)} />
                    </FormControl>
                </form>
            </div>


            <Grid container spacing={3}>

                <Grid item xs={2}>
                    <Paper className={classes.paper}>数据</Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper className={classes.paper}>比值</Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper className={classes.paper}>CV</Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper className={classes.paper}>实测浓度</Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper className={classes.paper}>对标浓度</Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper className={classes.paper}>相对偏差</Paper>
                </Grid>
            </Grid>

            <container>
                {Array.from({ length: 10 }, (value, index) =>
                    <DataForm index={index} className={classes.customForm} da1={da1} da2={da2} ppm={ppm} dilutionRatio={dilutionRatio} statObj={statObj} setStatObj={setStatObj}></DataForm>
                )}
            </container>



            <Grid container spacing={3} className={classes.submitBtns}>
                <Grid item xs={3}>
                    <Button label='caculate' variant="contained" color="primary" size='large' onClick={handleCaculateClick}>
                        计  算
                    </Button>
                </Grid>
                <Grid item xs={3}>
                    <Button label='refresh' variant="contained" color="primary" size='large' onClick={handleRefreshClick}>
                        重置
                    </Button>
                </Grid>
            </Grid>


            <Paper square>{
                showCharts ? <LinearChart statData={statData} gradient={gradient2} intercept={intercept2} R_square={R_square2}></LinearChart> : null
            }

            </Paper>

        </Container>
    )
}