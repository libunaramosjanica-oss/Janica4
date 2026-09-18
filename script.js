// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyAazHXV6k9HxJBV8GfHVCIDnDkaIVTytKE",

    authDomain:
        "jancal-fdf43.firebaseapp.com",

    databaseURL:
        "https://jancal-fdf43-default-rtdb.firebaseio.com",

    projectId:
        "jancal-fdf43",

    storageBucket:
        "jancal-fdf43.firebasestorage.app",

    messagingSenderId:
        "185115630186",

    appId:
        "1:185115630186:web:6382f7c91f42d179800813",

    measurementId:
        "G-JC48WSNV1G"
};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const firebaseApp =
    initializeApp(firebaseConfig);


// =====================================================
// INITIALIZE DATABASE
// =====================================================

const database =
    getDatabase(firebaseApp);


// =====================================================
// DATABASE PATH
// =====================================================

const dataRef =
    ref(
        database,
        "ESP32_Data"
    );


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let allSensorData = {};

let selectedDate = "";

let sensorChart = null;


// =====================================================
// DOM ELEMENTS
// =====================================================

const statusElement =
    document.getElementById(
        "firebaseStatus"
    );

const currentTemperature =
    document.getElementById(
        "currentTemperature"
    );

const currentHumidity =
    document.getElementById(
        "currentHumidity"
    );

const graphDate =
    document.getElementById(
        "graphDate"
    );

const historyDate =
    document.getElementById(
        "historyDate"
    );

const historyBody =
    document.getElementById(
        "historyTableBody"
    );

const recordCount =
    document.getElementById(
        "recordCount"
    );

const toggleHistory =
    document.getElementById(
        "toggleHistory"
    );

const historyContent =
    document.getElementById(
        "historyContent"
    );


// =====================================================
// FIREBASE STATUS
// =====================================================

function setStatus(
    text,
    connected
) {

    if (!statusElement) {
        return;
    }


    statusElement.textContent =
        "Firebase Status: " + text;


    if (connected) {

        statusElement.classList.remove(
            "status-error"
        );

        statusElement.classList.add(
            "status-connected"
        );

    }
    else {

        statusElement.classList.remove(
            "status-connected"
        );

        statusElement.classList.add(
            "status-error"
        );

    }

}


// =====================================================
// NUMBER HELPER
// =====================================================

function toNumber(value) {

    const number =
        Number(value);


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    return null;

}


// =====================================================
// FORMAT NUMBER
// =====================================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "--";

    }


    return Number(value)
        .toFixed(1);

}


// =====================================================
// GET LATEST READING
// =====================================================

function getLatestReading(data) {

    let latest = null;


    const dates =
        Object.keys(
            data || {}
        ).sort();


    for (
        const date of dates
    ) {

        const times =
            Object.keys(
                data[date] || {}
            ).sort();


        for (
            const time of times
        ) {

            const reading =
                data[date][time];


            if (
                !reading ||
                typeof reading !== "object"
            ) {

                continue;

            }


            const temperature =
                toNumber(
                    reading.temperature
                );


            const humidity =
                toNumber(
                    reading.humidity
                );


            if (
                temperature === null &&
                humidity === null
            ) {

                continue;

            }


            latest = {

                date: date,

                time: time,

                temperature:
                    temperature,

                humidity:
                    humidity

            };

        }

    }


    return latest;

}


// =====================================================
// GET DATE LIST
// =====================================================

function getDateList(data) {

    return Object.keys(
        data || {}
    )

    .filter(
        key =>
            data[key] &&
            typeof data[key] === "object"
    )

    .sort()
    .reverse();

}


// =====================================================
// POPULATE DATE SELECTS
// =====================================================

function populateDateSelect() {

    const dates =
        getDateList(
            allSensorData
        );


    // GRAPH DATE

    if (graphDate) {

        graphDate.innerHTML =
            "";


        if (dates.length === 0) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                "";

            option.textContent =
                "No dates available";

            graphDate.appendChild(
                option
            );

        }
        else {

            dates.forEach(
                date => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        date;

                    option.textContent =
                        date;

                    graphDate.appendChild(
                        option
                    );

                }
            );


            graphDate.value =
                selectedDate ||
                dates[0];

        }

    }


    // HISTORY DATE

    if (historyDate) {

        historyDate.innerHTML =
            "";


        if (dates.length === 0) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                "";

            option.textContent =
                "No dates available";

            historyDate.appendChild(
                option
            );

        }
        else {

            dates.forEach(
                date => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        date;

                    option.textContent =
                        date;

                    historyDate.appendChild(
                        option
                    );

                }
            );


            historyDate.value =
                selectedDate ||
                dates[0];

        }

    }

}


// =====================================================
// UPDATE CURRENT READING
// =====================================================

function updateCurrentReading() {

    const latest =
        getLatestReading(
            allSensorData
        );


    if (!latest) {

        if (currentTemperature) {

            currentTemperature.textContent =
                "-- °C";

        }


        if (currentHumidity) {

            currentHumidity.textContent =
                "-- %";

        }


        return;

    }


    if (currentTemperature) {

        currentTemperature.textContent =
            formatNumber(
                latest.temperature
            ) + " °C";

    }


    if (currentHumidity) {

        currentHumidity.textContent =
            formatNumber(
                latest.humidity
            ) + " %";

    }


    console.log(
        "LATEST READING:",
        latest
    );

}


// =====================================================
// GET READINGS FOR DATE
// =====================================================

function getReadingsForDate(date) {

    const result = [];


    if (!date) {

        return result;

    }


    const dayData =
        allSensorData[date];


    if (
        !dayData ||
        typeof dayData !== "object"
    ) {

        return result;

    }


    const times =
        Object.keys(dayData)
            .filter(
                time =>
                    dayData[time] &&
                    typeof dayData[time] === "object"
            )
            .sort();


    times.forEach(
        time => {

            const reading =
                dayData[time];


            const temperature =
                toNumber(
                    reading.temperature
                );


            const humidity =
                toNumber(
                    reading.humidity
                );


            if (
                temperature === null &&
                humidity === null
            ) {

                return;

            }


            result.push({

                time: time,

                temperature:
                    temperature,

                humidity:
                    humidity

            });

        }
    );


    return result;

}


// =====================================================
// UPDATE GRAPH
// =====================================================

function updateChart() {

    if (
        typeof Chart === "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

        return;

    }


    const date =
        graphDate
            ? graphDate.value
            : selectedDate;


    const readings =
        getReadingsForDate(
            date
        );


    const labels =
        readings.map(
            item => item.time
        );


    const temperatures =
        readings.map(
            item => item.temperature
        );


    const humidities =
        readings.map(
            item => item.humidity
        );


    const canvas =
        document.getElementById(
            "sensorChart"
        );


    if (!canvas) {

        return;

    }


    if (sensorChart) {

        sensorChart.destroy();

        sensorChart = null;

    }


    sensorChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Temperature (°C)",

                            data:
                                temperatures,

                            yAxisID:
                                "temperature",

                            tension:
                                0.3,

                            borderWidth:
                                3,

                            pointRadius:
                                4

                        },


                        {

                            label:
                                "Humidity (%)",

                            data:
                                humidities,

                            yAxisID:
                                "humidity",

                            tension:
                                0.3,

                            borderWidth:
                                3,

                            pointRadius:
                                4

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    animation: {

                        duration:
                            300

                    },

                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    scales: {

                        temperature: {

                            type:
                                "linear",

                            position:
                                "left",

                            title: {

                                display:
                                    true,

                                text:
                                    "Temperature (°C)"

                            }

                        },


                        humidity: {

                            type:
                                "linear",

                            position:
                                "right",

                            title: {

                                display:
                                    true,

                                text:
                                    "Humidity (%)"

                            },

                            grid: {

                                drawOnChartArea:
                                    false

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// UPDATE HISTORY
// =====================================================

function updateHistory() {

    if (!historyBody) {

        return;

    }


    const date =
        historyDate
            ? historyDate.value
            : selectedDate;


    const readings =
        getReadingsForDate(
            date
        );


    historyBody.innerHTML =
        "";


    if (readings.length === 0) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan = 3;


        cell.textContent =
            "No sensor data available.";


        row.appendChild(
            cell
        );


        historyBody.appendChild(
            row
        );


        if (recordCount) {

            recordCount.textContent =
                "0 records";

        }


        return;

    }


    readings
        .slice()
        .reverse()
        .forEach(
            reading => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const timeCell =
                    document.createElement(
                        "td"
                    );


                const temperatureCell =
                    document.createElement(
                        "td"
                    );


                const humidityCell =
                    document.createElement(
                        "td"
                    );


                timeCell.textContent =
                    reading.time;


                temperatureCell.textContent =
                    formatNumber(
                        reading.temperature
                    ) + " °C";


                humidityCell.textContent =
                    formatNumber(
                        reading.humidity
                    ) + " %";


                row.appendChild(
                    timeCell
                );


                row.appendChild(
                    temperatureCell
                );


                row.appendChild(
                    humidityCell
                );


                historyBody.appendChild(
                    row
                );

            }
        );


    if (recordCount) {

        recordCount.textContent =
            readings.length +
            (
                readings.length === 1
                    ? " record"
                    : " records"
            );

    }

}


// =====================================================
// UPDATE DASHBOARD
// =====================================================

function updateDashboard() {

    const dates =
        getDateList(
            allSensorData
        );


    console.log(
        "AVAILABLE DATES:",
        dates
    );


    if (dates.length === 0) {

        if (currentTemperature) {

            currentTemperature.textContent =
                "-- °C";

        }


        if (currentHumidity) {

            currentHumidity.textContent =
                "-- %";

        }


        return;

    }


    if (
        !selectedDate ||
        !dates.includes(
            selectedDate
        )
    ) {

        selectedDate =
            dates[0];

    }


    populateDateSelect();

    updateCurrentReading();

    updateChart();

    updateHistory();

}


// =====================================================
// FIREBASE REALTIME LISTENER
// =====================================================

console.log(
    "================================="
);

console.log(
    "CONNECTING TO JANICA FIREBASE"
);

console.log(
    "Database path: /ESP32_Data"
);

console.log(
    "================================="
);


setStatus(
    "Connecting...",
    false
);


onValue(

    dataRef,

    (snapshot) => {

        console.log(
            "FIREBASE DATA RECEIVED"
        );


        const value =
            snapshot.val();


        console.log(
            value
        );


        allSensorData =
            value || {};


        setStatus(
            "Connected",
            true
        );


        updateDashboard();

    },


    (error) => {

        console.error(
            "FIREBASE READ ERROR:",
            error
        );


        setStatus(
            "Error",
            false
        );

    }

);


// =====================================================
// GRAPH DATE CHANGE
// =====================================================

if (graphDate) {

    graphDate.addEventListener(
        "change",
        function () {

            selectedDate =
                this.value;


            if (historyDate) {

                historyDate.value =
                    selectedDate;

            }


            updateChart();

            updateHistory();

        }
    );

}


// =====================================================
// HISTORY DATE CHANGE
// =====================================================

if (historyDate) {

    historyDate.addEventListener(
        "change",
        function () {

            selectedDate =
                this.value;


            if (graphDate) {

                graphDate.value =
                    selectedDate;

            }


            updateHistory();

            updateChart();

        }
    );

}


// =====================================================
// SHOW / HIDE HISTORY
// =====================================================

if (toggleHistory) {

    toggleHistory.addEventListener(
        "click",
        function () {

            if (
                historyContent.classList.contains(
                    "hidden"
                )
            ) {

                historyContent.classList.remove(
                    "hidden"
                );


                toggleHistory.textContent =
                    "Hide History";


                updateHistory();

            }
            else {

                historyContent.classList.add(
                    "hidden"
                );


                toggleHistory.textContent =
                    "Show History";

            }

        }
    );

}


// =====================================================
// INITIAL STATUS
// =====================================================

setStatus(
    "Connecting...",
    false
);