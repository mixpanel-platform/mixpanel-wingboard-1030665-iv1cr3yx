
var runEventQuery = function(eventName, propName, dateRange, bucket) {
  //info for tracking
  var url = window.document.referrer.split('/mpplatform')[0]
  var id = url.split('report/')[1]

  propName =  typeof propName != "string" ? propName = null : propName
  var bucketValue
  if (bucket === 'day') {
    bucketValue = function(event){ return new Date(event.time).getDay()}
  }else{
    bucketValue = function(event){ return new Date(event.time).getHours()}
  }
  var today = new Date(dateRange.to).toISOString().split('T')[0]
  var t = new Date()
  var thisWeek = new Date(dateRange.from).toISOString().split('T')[0]
  var params ={
    start_date: thisWeek,
    end_date: today,
    selectedEvent: eventName,
    selectedProperty: propName,
    selectedBucket: bucket
  }
  if(params.selectedProperty){
    MP.api.jql(function main() {
      return Events({
        from_date: params.start_date,
        to_date:   params.end_date,
        event_selectors:[{event:params.selectedEvent}]
      })
      .groupBy(["name",'properties.'+params.selectedProperty, function (event) {if (params.selectedBucket === 'day') {
        return new Date(event.time).getDay()
      }else {
        return new Date(event.time).getHours()
      }}], mixpanel.reducer.count())
      .map(function(item){
        return {
          "*Event*": item.key[0],
          "Property": item.key[1],
          "Day of Week": item.key[2],
          "Tally of Views": item.value
        }
      })
    }, params
    ).done(function(results){
      var segment = {}
      if (bucket !== 'day' ) {
        var query = {
          'event': 'Query Run',
          'properties': {
            'token': '05096578a308d8c8b4e4cc92ffd949b9',
            'Report': 'Events by Day or Hour',
            'Query': 'Single Event Segmentation by a Property by Hour',
            'Properties Used?': true,
            'distinct_id': id,
            'Project id': id,
            'Local Hour': new Date().getHours()
          }
        }
        var stringVersion = JSON.stringify(query)
        var encoded = window.btoa(stringVersion)
        $.ajax({
          url: "https://api.mixpanel.com/track/?data="+encoded
        })

        _.each(results, function(value){
          segment[value['Property']] ={}  //cre
        })
        _.each(results, function(value){  //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
          var i = 0
          while (i < 24) {
            var time
            if (i === 0) {
              time = "12 am"
            }else if(i < 12 && i !== 0){
              time = i + " am"
            }else if (i === 12) {
              time = i + " pm"
            }else{
              time = i -12 + " pm"
            }
            segment[value['Property']][time] = 0
            i++
          }
        })
        _.each(results, function(value){
          _.each(segment, function (object, key) {
            var a = value['Day of Week']
            a += 1  //add one to get time denotion to be at index 1 not 0
            var time
            //modify the key value of the data object so that highcharts can properly order the data. if just number is passed highcharts throws error
            if(a < 12){
              time = a + " am"
            }else if (a === 12) {
              time = a + " pm"
            }else if(a === 24){
              time = a - 12 + " am"
            }else{
              time = a -12 + " pm"
            }
            segment[value['Property']][time] = value['Tally of Views']
          })
        })
        $('#graph').remove()            //remove the chart so that we can graph a new one with more xAxis values so we do not throw highcharts error #19
        _.each(segment, function(object){
          _.each(object, function(value, key){
          })
        })
        var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
          legend: {
            enabled: false,
            y: -7
          },
          xAxis: {
            max: 23
          },
          tooltip: {
            formatter: function () {
              var i = this.x + 1
              if (i === 0) {
                time = "12 am"
              }else if(i < 12 && i !== 0){
                time = i + " am"
              }else if (i === 12) {
                time = i + " pm"
              }else{
                time = i -12 + " pm"
              }
              return "<b>Hour in day: </b>" + time  + "</br><b>Number of " + eventName + "s in " + this.series.name + " : </b>" + this.y
            }
          },
          xAxis:{
            title: {
                    text: 'Hour in the Day'
                }
          },
          yAxis:{
            title: {
                    text: 'Counts'
                }
          }
        }})
        chart.MPChart('setData', segment)
      }else{
        var query = {
          'event': 'Query Run',
          'properties': {
            'token': '2bc1d27c6cc6f5dc8ea4809dcfb84e94',
            'Report': 'Events by Day or Hour',
            'Query': 'Single Event Segmentation by a Property by Day',
            'Properties Used?': true,
            'distinct_id': id,
            'Project id': id,
            'Local Hour': new Date().getHours()
          }
        }
        var stringVersion = JSON.stringify(query)
        var encoded = window.btoa(stringVersion)
        $.ajax({
          url: "https://api.mixpanel.com/track/?data="+encoded
        })
        _.each(results, function(value){
          segment[value['Property']] ={}
        })
        _.each(results, function(value){      //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
          var i = 1
          while (i < 7) {
            var day
            if(i === 0){
              day = "Sunday"
            }else if (i === 1) {
              day = "Monday"
            }else if (i === 2) {
              day = "Tuesday"
            }else if (i === 3) {
              day = "Wednesday"
            }else if (i === 4) {
              day = "Thursday"
            }else if (i === 5) {
              day = "Friday"
            }else if (i === 6) {
              day = "Saturday"
            }
            segment[value['Property']][day] = 0
            i++
          }
        })
        _.each(results, function(value){
          _.each(segment, function (object, key) {
            var day
            if(key === value['Property']){
              if(value['Day of Week'] === 0){
                day = "Sunday"
              }else if (value['Day of Week'] === 1) {
                day = "Monday"
              }else if (value['Day of Week'] === 2) {
                day = "Tuesday"
              }else if (value['Day of Week'] === 3) {
                day = "Wednesday"
              }else if (value['Day of Week'] === 4) {
                day = "Thursday"
              }else if (value['Day of Week'] === 5) {
                day = "Friday"
              }else if (value['Day of Week'] === 6) {
                day = "Saturday"
              }
              segment[value['Property']][day] = value['Tally of Views']
            }
          })
        })
        $('#graph').remove()
        var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
          legend: {
            enabled: false,
            y: -7
          },
          tooltip: {
            formatter: function () {
              var dayInWeek
              if(this.x === 0){
                dayInWeek = "Monday"
              }else if (this.x  === 1) {
                dayInWeek = "Tuesday"
              }else if (this.x  === 2) {
                dayInWeek = "Wednesday"
              }else if (this.x  === 3) {
                dayInWeek = "Thursday"
              }else if (this.x === 4) {
                dayInWeek = "Friday"
              }else if (this.x === 5) {
                dayInWeek = "Saturday"
              }else if (this.x === 6) {
                dayInWeek = "Sunday"
              }
              return "<b>Day of the week: </b>" + dayInWeek + "</br><b>Number of " + eventName + "s in " + this.series.name + " : </b>" + this.y
            }
          },
          xAxis:{
            title: {
                    text: 'Day of the Week'
                }
          },
          yAxis:{
            title: {
                    text: 'Counts'
                }
          }
        }})
        chart.MPChart('setData', segment)
        var table = $('#table').MPTable({
          showPercentages: true,
          firstColHeader: 'Events By Day of Week'
        })
        //table.MPTable('setData',segment)
      }
    })
  }else{
    if (eventName){
      MP.api.jql(function main() {
        return Events({
          from_date: params.start_date,
          to_date:   params.end_date,
          event_selectors:[{event:params.selectedEvent}]
        })
        .groupBy(["name",function (event) {if (params.selectedBucket === 'day') {
          return new Date(event.time).getDay()
        }else {
          return new Date(event.time).getHours()
        }}], mixpanel.reducer.count())
        .map(function(item){
          return {
            "*Event*": item.key[0],
            "Day of Week": item.key[1],
            "Tally of Views": item.value
          }
        })
      }, params
      ).done(function(results){
        var segment = {} //create final data object that will be used in charts
        if (bucket !== 'day' ) {
          var query = {
            'event': 'Query Run',
            'properties': {
              'token': '05096578a308d8c8b4e4cc92ffd949b9',
              'Report': 'Events by Day or Hour',
              'Query': 'Single Event Segmentation by Hour',
              'Properties Used?': false,
              'distinct_id': id,
              'Project id': id,
              'Local Hour': new Date().getHours()
            }
          }
          var stringVersion = JSON.stringify(query)
          var encoded = window.btoa(stringVersion)
          $.ajax({
            url: "https://api.mixpanel.com/track/?data="+encoded
          })
          _.each(results, function(value){
            segment[value['*Event*']] ={}  //cre
          })
          _.each(results, function(value){  //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
            var i = 1
            while (i < 25) {
              var time
              if (i === 0) {
                time = "12 am"
              }else if(i < 12 && i !== 0){
                time = i + " am"
              }else if (i === 12) {
                time = i + " pm"
              }else{
                time = i -12 + " pm"
              }
              segment[value['*Event*']][time] = 0
              i++
            }
          })
          _.each(results, function(value){
            _.each(segment, function (object, key) {
              var i = value['Day of Week']
              var time
              //modify the key value of the data object so that highcharts can properly order the data. if just number is passed highcharts throws error
              if (i === 0) {
                time = "12 am"
              }else if(i < 12 && i !== 0){
                time = i + " am"
              }else if (i === 12) {
                time = i + " pm"
              }else{
                time = i -12 + " pm"
              }
              segment[value['*Event*']][time] = value['Tally of Views']
            })
          })
          $('#graph').remove()            //remove the chart so that we can graph a new one with more xAxis values so we do not throw highcharts error #19
          _.each(segment, function(object){
            _.each(object, function(value, key){
            })
          })
          var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
            legend: {
              enabled: false,
              y: -7
            },
            xAxis: {
              max: 23
            },
            tooltip: {
              formatter: function () {
                var i = this.x + 1
                if (i === 0) {
                  time = "12 am"
                }else if(i < 12 && i !== 0){
                  time = i + " am"
                }else if (i === 12) {
                  time = i + " pm"
                }else{
                  time = i -12 + " pm"
                }
                return "<b>Hour in day: </b>" + time + "</br><b>Number of " + eventName + " : </b>" + this.y
              }
            },
            xAxis:{
              title: {
                      text: 'Hour in the Day'
                  }
            },
            yAxis:{
              title: {
                      text: 'Counts'
                  }
            }
          }})
          chart.MPChart('setData', segment)
        }else{
          var query = {
            'event': 'Query Run',
            'properties': {
              'token': '05096578a308d8c8b4e4cc92ffd949b9',
              'Report': 'Events by Day or Hour',
              'Query': 'Single Event Segmentation by Day',
              'Properties Used?': false,
              'distinct_id': id,
              'Project id': id,
              'Local Hour': new Date().getHours()
            }
          }
          var stringVersion = JSON.stringify(query)
          var encoded = window.btoa(stringVersion)
          $.ajax({
            url: "https://api.mixpanel.com/track/?data="+encoded
          })
          _.each(results, function(value){
            segment[value['*Event*']] ={}  //cre
          })
          _.each(results, function(value){      //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
            var i = 1
            while (i < 7) {
              var day
              if(i === 0){
                day = "Sunday"
              }else if (i === 1) {
                day = "Monday"
              }else if (i === 2) {
                day = "Tuesday"
              }else if (i === 3) {
                day = "Wednesday"
              }else if (i === 4) {
                day = "Thursday"
              }else if (i === 5) {
                day = "Friday"
              }else if (i === 6) {
                day = "Saturday"
              }
              segment[value['*Event*']][day] = 0
              i++
            }
          })
          _.each(results, function(value){
            _.each(segment, function (object, key) {
              var day
              if(key === value['*Event*']){
                if(value['Day of Week'] === 0){
                  day = "Sunday"
                }else if (value['Day of Week'] === 1) {
                  day = "Monday"
                }else if (value['Day of Week'] === 2) {
                  day = "Tuesday"
                }else if (value['Day of Week'] === 3) {
                  day = "Wednesday"
                }else if (value['Day of Week'] === 4) {
                  day = "Thursday"
                }else if (value['Day of Week'] === 5) {
                  day = "Friday"
                }else if (value['Day of Week'] === 6) {
                  day = "Saturday"
                }
                segment[value['*Event*']][day] = value['Tally of Views']
              }
            })
          })
          $('#graph').remove()
          var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
            legend: {
              enabled: false,
              y: -7
            },
            tooltip: {
              formatter: function () {
                var dayInWeek
                if(this.x === 0){
                  dayInWeek = "Monday"
                }else if (this.x  === 1) {
                  dayInWeek = "Tuesday"
                }else if (this.x  === 2) {
                  dayInWeek = "Wednesday"
                }else if (this.x  === 3) {
                  dayInWeek = "Thursday"
                }else if (this.x === 4) {
                  dayInWeek = "Friday"
                }else if (this.x === 5) {
                  dayInWeek = "Saturday"
                }else if (this.x === 6) {
                  dayInWeek = "Sunday"
                }
                return "<b>Day of the week: </b>" + dayInWeek + "</br><b>Number of " + eventName + " : </b>" + this.y
              }
            },
            xAxis:{
              title: {
                      text: 'Day of the Week'
                  },
              type: "category"
            },
            yAxis:{
              title: {
                      text: 'Counts'
                  }
            }
          }})
          chart.MPChart('setData', segment)
        }
      })
    }else{
      MP.api.jql(function main() {
        return Events({
          from_date: params.start_date,
          to_date:   params.end_date
        })
        .groupBy(["name",function (event) {if (params.selectedBucket === 'day') {
          return new Date(event.time).getDay()
        }else {
          return new Date(event.time).getHours()
        }}], mixpanel.reducer.count())
        .map(function(item){
          return {
            "*Event*": item.key[0],
            "Day of Week": item.key[1],
            "Tally of Views": item.value
          }
        })
      }, params
      ).done(function(results){
        var segment = {}    //create final data object that will be used in charts
        if (bucket !== 'day') {
          var query = {
            'event': 'Query Run',
            'properties': {
              'token': '05096578a308d8c8b4e4cc92ffd949b9',
              'Report': 'Events by Day or Hour',
              'Query': 'Multi Event Segmentation by Hour',
              'Properties Used?': false,
              'distinct_id': id,
              'Project id': id,
              'Local Hour': new Date().getHours()
            }
          }
          var stringVersion = JSON.stringify(query)
          var encoded = window.btoa(stringVersion)
          $.ajax({
            url: "https://api.mixpanel.com/track/?data="+encoded
          })
          _.each(results, function(value){
            segment[value['*Event*']] ={}  //cre
          })
          _.each(results, function(value){      //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
            var i = 1
            while (i < 25) {
              var time
              if (i === 0) {
                time = "12 am"
              }else if(i < 12 && i !== 0){
                time = i + " am"
              }else if (i === 12) {
                time = i + " pm"
              }else{
                time = i -12 + " pm"
              }
              segment[value['*Event*']][time] = 0
              i++
            }
          })
          _.each(results, function(value){
            var i = 1
            _.each(segment, function (object, key) {
              var a = value['Day of Week']
              a += 1  //add one to get time denotion to be at index 1 not 0
              var time
              //modify the key value of the data object so that highcharts can properly order the data. if just number is passed highcharts throws error
              if (i === 0) {
                time = "12 am"
              }else if(i < 12 && i !== 0){
                time = i + " am"
              }else if (i === 12) {
                time = i + " pm"
              }else{
                time = i -12 + " pm"
              }
              segment[value['*Event*']][time] = value['Tally of Views']
            })
          })
          $('#graph').remove()            //remove the chart so that we can graph a new one with more xAxis values so we do not throw highcharts error #19
          var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
            legend: {
              enabled: false,
              y: -7
            },
            xAxis: {
              max: 23,
            },
            tooltip: {
              formatter: function () {
                var i = this.x + 1
                if (i === 0) {
                  time = "12 am"
                }else if(i < 12 && i !== 0){
                  time = i + " am"
                }else if (i === 12) {
                  time = i + " pm"
                }else{
                  time = i -12 + " pm"
                }
                return "<b>Hour in day: </b>" + time + "</br><b>Number of " + this.series.name + " : </b>" + this.y
              }
            },
            xAxis:{
              title: {
                      text: 'Hour in the Day'
                  }
            },
            yAxis:{
              title: {
                      text: 'Counts'
                  }
            }
          }})
          chart.MPChart('setData', segment)
        }else {
          var query = {
            'event': 'Query Run',
            'properties': {
              'token': '05096578a308d8c8b4e4cc92ffd949b9',
              'Report': 'Events by Day or Day',
              'Query': 'Single Event Segmentation by Hour',
              'Properties Used?': false,
              'distinct_id': id,
              'Project id': id,
              'Local Hour': new Date().getHours()
            }
          }
          var stringVersion = JSON.stringify(query)

          var encoded = window.btoa(stringVersion)
          $.ajax({
            url: "https://api.mixpanel.com/track/?data="+encoded
          })
          _.each(results, function(value){
            segment[value['*Event*']] ={}  //cre
          })
          _.each(results, function(value){      //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
            var i = 1
            while (i < 7) {
              var day
              if(i === 0){
                day = "Sunday"
              }else if (i === 1) {
                day = "Monday"
              }else if (i === 2) {
                day = "Tuesday"
              }else if (i === 3) {
                day = "Wednesday"
              }else if (i === 4) {
                day = "Thursday"
              }else if (i === 5) {
                day = "Friday"
              }else if (i === 6) {
                day = "Saturday"
              }
              segment[value['*Event*']][day] = 0
              i++
            }
          })
          _.each(results, function(value){
            _.each(segment, function (object, key) {
              var day
              if(key === value['*Event*']){
                if(value['Day of Week'] === 0){
                  day = "Sunday"
                }else if (value['Day of Week'] === 1) {
                  day = "Monday"
                }else if (value['Day of Week'] === 2) {
                  day = "Tuesday"
                }else if (value['Day of Week'] === 3) {
                  day = "Wednesday"
                }else if (value['Day of Week'] === 4) {
                  day = "Thursday"
                }else if (value['Day of Week'] === 5) {
                  day = "Friday"
                }else if (value['Day of Week'] === 6) {
                  day = "Saturday"
                }
                segment[value['*Event*']][day] = value['Tally of Views']
              }
            })
          })
          $('#graph').remove()
          var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
            legend: {
              enabled: false,
              y: -7
            },
            tooltip: {
              formatter: function () {
                var dayInWeek
                if(this.x === 0){
                  dayInWeek = "Monday"
                }else if (this.x  === 1) {
                  dayInWeek = "Tuesday"
                }else if (this.x  === 2) {
                  dayInWeek = "Wednesday"
                }else if (this.x  === 3) {
                  dayInWeek = "Thursday"
                }else if (this.x === 4) {
                  dayInWeek = "Friday"
                }else if (this.x === 5) {
                  dayInWeek = "Saturday"
                }else if (this.x === 6) {
                  dayInWeek = "Sunday"
                }
                return "<b>Day of the week: </b>" + dayInWeek + "</br><b>Number of " + eventName + " : </b>" + this.y
              }
            },
            xAxis:{
              title: {
                      text: 'Day of the Week'
                  }
            },
            yAxis:{
              title: {
                      text: 'Counts'
                  }
            }
          }})
          chart.MPChart('setData', segment)
        }
      })
    }
  }
};
