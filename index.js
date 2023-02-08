let page = {
    urls: {
        getLyric: "https://storage.googleapis.com/ikara-storage/ikara/lyrics.xml",
    },
    elements: {},
    commands: {},
}

page.elements.btnPlayAndPause = $("#btnPlayAndPause");
page.elements.currentTime = $("#currentTime");
page.elements.duration = $("#duration");
page.elements.lyricBefore = $("#lyricBefore");
page.elements.lyricAfter = $("#lyricAfter");


let isPlay = false;
let audio = document.getElementById("audio");
let progress = document.getElementById("progress");
let lyricsAudio = [];
let renderLyrics = setInterval(page.commands.renderLyrics, 1);
let paintLyrics = setInterval(page.commands.paintLyrics, 0.1);

class LyricParam {
    constructor(timeParam, lyricsParam){
        this.timeParam = timeParam;
        this.lyricsParam = lyricsParam;
    }
}

class ChartLyric {
    constructor(timeChart, chartLyric) {
        this.timeChart = timeChart;
        this.chartLyric = chartLyric;
    }
}

page.elements.btnPlayAndPause.on("click", () =>{
    page.commands.playAndPause();

})

page.commands.playAndPause = () => {
    if(isPlay) {
        audio.pause();
        $("#iconPlay").attr("hidden", false);
        $("#iconPause").attr("hidden", true);
        isPlay = false;
        clearInterval(renderLyrics);
        clearInterval(paintLyrics);
    } else {
        audio.play();
        $("#iconPlay").attr("hidden", true);
        $("#iconPause").attr("hidden", false);
        isPlay = true;
        renderLyrics = setInterval(page.commands.renderLyrics, 1);
        paintLyrics = setInterval(page.commands.paintLyrics, 0.1);
    }
}

audio.ontimeupdate = function() {
    page.elements.duration.text(page.commands.formatTime(audio.duration));

    if(audio.duration){
        const progressPercent = Math.floor((audio.currentTime/audio.duration) * 100);
        progress.value = progressPercent;
        page.elements.currentTime.text(page.commands.formatTime(audio.currentTime));
    } else {
        page.elements.currentTime.text("00:00");
    }
};

progress.onchange = function (e) {
    const seekTime = (audio.duration / 100) * e.target.value;
    audio.currentTime = seekTime;
    let flag = true;
    for (let i = 0; i < lyricsAudio.length; i++) {
        let num1 = +(lyricsAudio[i].timeParam);
        let num2 = 0;
        if (lyricsAudio[i + 1] != undefined) {
            num2 = +(lyricsAudio[i + 1].timeParam);
            if (+(num2.toFixed(2)) > +(audio.currentTime.toFixed(2)) && +(audio.currentTime.toFixed(2)) > +(num1.toFixed(2)) && flag == true) {
                page.commands.renderChangeProgress(i);
                flag = false;
            } else if (+(audio.currentTime.toFixed(2)) < +(num1.toFixed(2)) && flag == true) {
                $("#firtLyricBefore").replaceWith(`<p id='firtLyricBefore'></p>`);
                $("#secondLyricAfter").replaceWith(`<p id='secondLyricAfter'></p>`);
                flag = false;
            } else if (+(lyricsAudio[lyricsAudio.length - 1].timeParam) < +(audio.currentTime.toFixed(2)) && +(audio.currentTime.toFixed(2)) < audio.duration && flag == true) {
                page.commands.renderChangeProgress(lyricsAudio.length);
                flag = false;
            }
        }
    }
};

page.commands.formatTime = (time) => {
    let minute = Math.floor(time/60);
    let second = Math.floor(time - minute * 60);
    return `${minute < 10 ? "0" + minute : minute} : ${second < 10 ? "0" + second : second}`;
}

let xmlText = "";
fetch(page.urls.getLyric).then((response) => {
    response.text().then((xml) => {
        xmlText = xml;
        let parser = new DOMParser();
        let xmlDOM = parser.parseFromString(xmlText, 'application/xml');
        let lyrics = xmlDOM.querySelectorAll("data");
        lyrics.forEach(lyricsXmlParam => {
            for (let i = 0; i < lyricsXmlParam.children.length; i++) {
                let sizeParam = lyricsXmlParam.children[i].getElementsByTagName('i').length;
                let lyricsParam = new LyricParam();
                var lyricsChart = [];
                for (let j = 0; j < sizeParam; j++) {
                    let chartLyric = new ChartLyric();
                    chartLyric.timeChart = lyricsXmlParam.children[i].getElementsByTagName('i')[j].getAttribute('va');
                    chartLyric.chartLyric = lyricsXmlParam.children[i].getElementsByTagName('i')[j].textContent;
                    lyricsChart.push(chartLyric);
                }
                lyricsParam.timeParam = lyricsXmlParam.children[i].getElementsByTagName('i')[0].getAttribute('va');
                lyricsParam.lyricsParam = lyricsChart;
                lyricsAudio.push(lyricsParam);
            }
        });
    });
})

page.commands.renderLyrics = () => {
    for (let i = 0; i < lyricsAudio.length; i++) {
        let numberTimeLyric = +(lyricsAudio[i].timeParam);
        if (+(audio.currentTime.toFixed(2)) + 0.5 == +(numberTimeLyric.toFixed(2)) + 0.5) {
            page.commands.render(i)
        }
    }
}

page.commands.render = (i) => {
    let paramChartFirst = '';
    let paramChartSecond = '';
    for (let j = 0; j < lyricsAudio[i].lyricsParam.length; j++) {
        let timeSlow = +(lyricsAudio[i].lyricsParam[j].timeChart);
        let timeFirst = 0;
        let timeSecond = +(lyricsAudio[i].lyricsParam[j].timeChart);
        let timeSpace = 0;
        if (lyricsAudio[i].lyricsParam[j + 1]) {
            for (let k = 0; k < lyricsAudio[i].lyricsParam[j].chartLyric.length; k++) {
                timeFirst = +(lyricsAudio[i].lyricsParam[j + 1].timeChart);
                timeSpace = (timeFirst - timeSecond) / (+(lyricsAudio[i].lyricsParam[j].chartLyric.length) + 1);
                timeSlow += timeSpace;
                if (lyricsAudio[i].lyricsParam[j].chartLyric[k] == ' ') {
                    paramChartFirst += `<span>&nbsp</span> `;
                } else {
                    paramChartFirst += `<span id="${timeSlow.toFixed(2)}">${lyricsAudio[i].lyricsParam[j].chartLyric[k]}</span> `;
                }
            }
        } else {
            for (let k = 0; k < lyricsAudio[i].lyricsParam[j].chartLyric.length; k++) {
                if (lyricsAudio[i + 1] != undefined) {
                    timeFirst = +(lyricsAudio[i + 1].lyricsParam[0].timeChart);
                    timeSpace = (timeFirst - timeSecond) / 5 / (+(lyricsAudio[i].lyricsParam[j].chartLyric.length));
                } else {
                    timeFirst = audio.duration - +(lyricsAudio[i].lyricsParam[j].timeChart);
                    timeSpace = (audio.duration - timeSecond) / 5 / (+(lyricsAudio[i].lyricsParam[j].chartLyric.length));
                }
                timeSlow += timeSpace;
                if (lyricsAudio[i].lyricsParam[j].chartLyric[k] == ' ') {
                    paramChartFirst += `<span id="${timeSlow.toFixed(2)}">&nbsp</span> `;
                } else {
                    paramChartFirst += `<span id="${timeSlow.toFixed(2)}">${lyricsAudio[i].lyricsParam[j].chartLyric[k]}</span> `;
                }
            }
        }
    }
    if (lyricsAudio[i + 1] != undefined) {
        for (let j = 0; j < lyricsAudio[i + 1].lyricsParam.length; j++) {
            paramChartSecond += lyricsAudio[i + 1].lyricsParam[j].chartLyric;
        }
    }
    $("#firtLyricBefore").replaceWith(`<p id='firtLyricBefore'>${paramChartFirst}</p>`);
    $("#secondLyricAfter").replaceWith(`<p id='secondLyricAfter'>${paramChartSecond}</p>`);
}

page.commands.renderChangeProgress = (i) => {
    let paramChartFirst = '';
    let paramChartSecond = '';
    if (lyricsAudio[i] != undefined) {
        for (let j = 0; j < lyricsAudio[i].lyricsParam.length; j++) {
            let timeSlow = +(lyricsAudio[i].lyricsParam[j].timeChart);
            let timeFirst = 0;
            let timeSecond = +(lyricsAudio[i].lyricsParam[j].timeChart);
            let timeSpace = 0;
            if (lyricsAudio[i].lyricsParam[j + 1]) {
                for (let k = 0; k < lyricsAudio[i].lyricsParam[j].chartLyric.length; k++) {
                    timeFirst = +(lyricsAudio[i].lyricsParam[j + 1].timeChart);
                    timeSpace = (timeFirst - timeSecond) / (+(lyricsAudio[i].lyricsParam[j].chartLyric.length) + 1);
                    timeSlow += timeSpace;

                    if (lyricsAudio[i].lyricsParam[j].chartLyric[k] == ' ') {
                        paramChartFirst += `<span>&nbsp</span> `;
                    } else {
                        if (+(timeSlow.toFixed(2)) < +(audio.currentTime.toFixed(2))) {
                            paramChartFirst += `<span id="${timeSlow.toFixed(2)}" class="paintGreen">${lyricsAudio[i].lyricsParam[j].chartLyric[k]}</span> `;
                        } else {
                            paramChartFirst += `<span id="${timeSlow.toFixed(2)}">${lyricsAudio[i].lyricsParam[j].chartLyric[k]}</span> `;
                        }
                    }
                }
            } else {
                for (let k = 0; k < lyricsAudio[i].lyricsParam[j].chartLyric.length; k++) {
                    if (lyricsAudio[i + 1] != undefined) {
                        timeFirst = +(lyricsAudio[i + 1].lyricsParam[0].timeChart);
                        timeSpace = (timeFirst - timeSecond) / 5 / (+(lyricsAudio[i].lyricsParam[j].chartLyric.length));
                    } else {
                        timeFirst = audio.duration - +(lyricsAudio[i].lyricsParam[j].timeChart);
                        timeSpace = (audio.duration - timeSecond) / 5 / (+(lyricsAudio[i].lyricsParam[j].chartLyric.length));
                    }
                    timeSlow += timeSpace;
                    if (lyricsAudio[i].lyricsParam[j].chartLyric[k] == ' ') {
                        paramChartFirst += `<span id="${timeSlow.toFixed(2)}">&nbsp</span> `;
                    } else {
                        if (+(timeSlow.toFixed(2)) < +(audio.currentTime.toFixed(2))) {
                            paramChartFirst += `<span id="${timeSlow.toFixed(2)}" class="paintGreen">${lyricsAudio[i].lyricsParam[j].chartLyric[k]}</span> `;
                        } else {
                            paramChartFirst += `<span id="${timeSlow.toFixed(2)}">${lyricsAudio[i].lyricsParam[j].chartLyric[k]}</span> `;
                        }
                    }
                }
            }
        }
        $("#firtLyricBefore").replaceWith(`<p id='firtLyricBefore'>${paramChartFirst}</p>`);
    } else {
        for (let j = 0; j < lyricsAudio[i - 1].lyricsParam.length; j++) {
            paramChartFirst += lyricsAudio[i - 1].lyricsParam[j].chartLyric;
        }
        $("#firtLyricBefore").replaceWith(`<p id='firtLyricBefore'>${paramChartFirst}</p>`);
        document.getElementById("firtLyricBefore").classList.add("paintGreen");
    }
    if (lyricsAudio[i + 1] != undefined) {
        for (let j = 0; j < lyricsAudio[i + 1].lyricsParam.length; j++) {
            paramChartSecond += lyricsAudio[i + 1].lyricsParam[j].chartLyric;
        }
    }
    $("secondLyricAfter").replaceWith(`<p id='secondLyricAfter'>${paramChartSecond}</p>`);
}

page.commands.paintLyrics = () => {
    if (document.getElementById(audio.currentTime.toFixed(2))) {
        document.getElementById(audio.currentTime.toFixed(2)).classList.add("paintGreen");
    }
}