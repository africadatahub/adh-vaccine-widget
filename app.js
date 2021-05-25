/* Set site and viz to log views */
let tracker = 'https://api.mediahack.co.za/adh/tracker/'
let site = 'kenya-widget'
let viz = 'adh-vaccine-widget'
let iso = 'KEN'

import * as d3 from 'd3'
let vaccinations
let startDate
let endDate = new Date()
let days
let dates
let numberFormat = new Intl.NumberFormat()
let formatDate = d3.timeFormat('%e %b')
let parseTime = d3.timeParse('%Y-%m-%d')
const margin = {
  left: 15,
  right: 15,
  top: 15,
  bottom: 15,
}
const height = 140
const width = +d3.select('.chart').style('width').replace('px', '')

const svg = d3
  .select('.chart')
  .append('svg')
  .attr('width', width)
  .attr('height', height)

async function getData() {
  await fetch('https://api.mediahack.co.za/adh/mhc-vaccinations.php')
    .then((data) => data.json())
    .then((data) => {
      let newData = data.filter((d) => d.iso_code === iso)
      startDate = parseTime(newData[0].date_of_report)

      dates = getDates(startDate, endDate)

      let Difference_In_Time = endDate.getTime() - startDate.getTime()
      days = (Difference_In_Time / (1000 * 3600 * 24)).toFixed(0)

      newData.forEach((d) => {
        d.total_vaccine_doses_to_date = +d.total_vaccine_doses_to_date
        d.date_of_report = parseTime(d.date_of_report)
      })
      let prevVacs = 0
      newData.forEach((d) => {
        d.daily_vaccines = d.total_vaccine_doses_to_date - prevVacs
        prevVacs = d.total_vaccine_doses_to_date
      })

      vaccinations = newData
    })
}
getData().then(() => {
  let x = d3
    .scaleTime()
    .domain([startDate, endDate])
    .range([30, width - 20])

  let y = d3
    .scaleLinear()
    .domain([0, d3.max(vaccinations, (d) => d.daily_vaccines)])

    .range([height - 25, 15])

  function x_axis() {
    return d3.axisBottom(x).tickFormat(d3.timeFormat('%e %b'))
  }
  function y_axis() {
    return d3.axisLeft(y).tickFormat((d) => {
      if (d / 1000 > 1) {
        return d / 1000 + 'k'
      } else {
        return d
      }
    })
  }

  function y_grid() {
    return d3.axisLeft(y).tickFormat('')
  }

  svg
    .append('g')
    .attr('transform', `translate(35,-1)`)
    .attr('class', 'y-axis')
    .call(y_axis().ticks(5))

  svg
    .append('g')
    .attr('transform', `translate(25,-1)`)
    .attr('class', 'y-grid')
    .call(
      y_grid()
        .ticks(5)
        .tickSize(-width + 35, 0, 0)
        .tickFormat('')
    )

  svg
    .selectAll('.bars')
    .data(vaccinations)
    .enter()
    .append('rect')
    .attr('x', (d) => x(d.date_of_report) + 5)
    .attr('y', (d) => {
      return y(d.daily_vaccines)
    })
    .attr('width', (d) => {
      return width / days - 2
    })
    .attr('height', (d) => height - 25 - y(d.daily_vaccines))
    .style('fill', '#83D13A')

  //  Add dates
  let dateCount = +(days / 6).toFixed(0)

  for (let c = 0; c < dates.length; c = c + dateCount) {
    svg
      .append('text')
      .attr('x', x(dates[c]) + 8)
      .attr('y', 130)
      .text(formatDate(dates[c]))
      .attr('class', 'x-label')

    svg
      .append('line')
      .attr('x1', x(dates[c]) + 7)
      .attr('x2', x(dates[c]) + 7)
      .attr('y1', 116)
      .attr('y2', 120)
      .style('stroke', 'gray')
      .style('stroke-width', 1)
  }
  d3.select('.total-vaccinated').text(() => {
    return numberFormat.format(
      vaccinations[vaccinations.length - 1].total_vaccine_doses_to_date
    )
  })
  d3.select('.daily-vaccinated').text(() => {
    return numberFormat.format(
      vaccinations[vaccinations.length - 1].vaccinated_daily
    )
  })
})

// Returns an array of dates between the two dates
var getDates = function (startDate, endDate) {
  var dates = [],
    currentDate = startDate,
    addDays = function (days) {
      var date = new Date(this.valueOf())
      date.setDate(date.getDate() + days)
      return date
    }
  while (currentDate <= endDate) {
    dates.push(currentDate)
    currentDate = addDays.call(currentDate, 1)
  }
  return dates
}

// logging
let referrer = document.referrer
let url = `${tracker}?s=${site}&v=${viz}&r=${referrer}`
fetch(url)
