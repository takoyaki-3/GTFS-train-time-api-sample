const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.hello = functions.https.onRequest((request,response) => {
  if(request.query.name !== undefined){
    response.send("Hello " + request.query.name + " !");
  } else {
    response.send("Hello from Firebase!");
  }
});

// timetableapi関数の定義
exports.timetableapi = functions.https.onRequest((request,response) => {

  let stoptimesurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fstop_times.json?alt=media';
  let calendarurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fcalendar.json?alt=media';
  let calendar_datesurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fcalendar_dates.json?alt=media';
  let tripsurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Ftrips.json?alt=media';

  const https = require('https');

  https.get(stoptimesurl, function (res) {
    let buf = [];
    res.on('data', function(chunk) {
      buf.push(chunk);
    }).on('end', function() {
      let text   = Buffer.concat(buf);
      let stoptimes_result = JSON.parse(text);

/*      let a = [];
      for(let i=0;i<stoptimes_result.length;i++){
        if(stoptimes_result[i].stop_id!==request.query.stop_id) continue;
        a.push(stoptimes_result[i]);
      }*/

      https.get(calendar_datesurl, function (res) {
        let buf = [];
        res.on('data', function(chunk) {
          buf.push(chunk);
        }).on('end', function() {
          let text   = Buffer.concat(buf);
          let calendardates_result = JSON.parse(text);
          let calendardateservices = [];

          // 日付取得
          var dt = new Date();

          // 日本の時間に修正
          dt.setTime(dt.getTime() + 32400000);

          // 日付フォーマットを整理
          let year = ( '0000' + dt.getFullYear() ).slice( -4 );
          let month = ( '00' + (dt.getMonth()+1) ).slice( -2 );
          let day = ( '00' + dt.getDate() ).slice( -2 );
          let today = year+month+day;

          // 今日の日付に関係のあるデータのみ抽出
          for(let i=0;i<calendardates_result.length;i++){
            if(calendardates_result[i].date!==today) continue;
            calendardateservices.push(calendardates_result[i]);
          }

          https.get(calendarurl, function (res) {
            let buf = [];
            res.on('data', function(chunk) {
              buf.push(chunk);
            }).on('end', function() {
              let text   = Buffer.concat(buf);
              let calendar_result = JSON.parse(text);

              // 曜日（0:日 1:月 ... 6:土）
              var dayOfWeek = dt.getDay();

              let service_ids = [];

              for(let i=0;i<calendar_result.length;i++){

                // データの期間に含まれているか
                if(Number(calendar_result[i].start_date) > Number(today)) continue;
                if(Number(calendar_result[i].end_date) < Number(today)) continue;

                let flag=0;

                // この曜日に運行されているか
                if(dayOfWeek===0) flag=calendar_result[i].sunday;
                else if(dayOfWeek===1) flag=calendar_result[i].monday;
                else if(dayOfWeek===2) flag=calendar_result[i].tuesday;
                else if(dayOfWeek===3) flag=calendar_result[i].wednesday;
                else if(dayOfWeek===4) flag=calendar_result[i].thursday;
                else if(dayOfWeek===5) flag=calendar_result[i].friday;
                else if(dayOfWeek===6) flag=calendar_result[i].saturday;

                if(Number(flag)===0) flag=false;
                else flag=true;

                // 特別運休になっているか
                for(let j=0;j<calendardateservices.length;j++){
                  if(calendardateservices[j].service_id!==r[i].service_id) continue;
                  if(Number(calendardateservices[j].exception_type)===2) flag=false;
                  break;
                }

                if(flag===true) service_ids.push(calendar_result[i].service_id);

              }
              
              // 特別運行を追加
              for(let j=0;j<calendardateservices.length;j++){
                if(Number(calendardateservices[j].exception_type)===1) service_ids.push(calendardateservices[j].service_id);
              }

              // trips.json の読み込み
              https.get(tripsurl, function (res) {
                let buf = [];
                res.on('data', function(chunk) {
                  buf.push(chunk);
                }).on('end', function() {
                  let text   = Buffer.concat(buf);
                  let trips_result = JSON.parse(text);
                  let tripids = [];

                  // 抽出するtrip_idをリストアップする
                  for(let i=0;i<trips_result.length;i++){
                    let f=false;
                    for(let j=0;j<service_ids.length;j++){
                      if(trips_result[i].service_id!==service_ids[j]) continue;
                      f=true;
                      break;
                    }
                    if(f===false) continue;
                    tripids.push(trips_result[i].trip_id);
                  }

                  // 出力データを抽出する
                  let a = [];
                  for(let i=0;i<stoptimes_result.length;i++){
                    if(stoptimes_result[i].stop_id!==request.query.stop_id) continue;
                    for(let j=0;j<tripids.length;j++){
                      if(tripids[j]===stoptimes_result[i].trip_id){
                        a.push(stoptimes_result[i]);
                        break;
                      }
                    }
                  }
                  response.send(JSON.stringify(a));
                  return;
                });
              });
            });
          });
        });
      });

//      response.send(JSON.stringify(a));
//      return;
    });
  });
  return;
});