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

  // CORS用にAccess-Control-Allow系ヘッダを追加
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  let stoptimesurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebase プロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fstop_times.json?alt=media';
  let calendarurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebase プロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fcalendar.json?alt=media';
  let calendar_datesurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebase プロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fcalendar_dates.json?alt=media';
  let tripsurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebase プロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Ftrips.json?alt=media';

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
                  if(calendardateservices[j].service_id!==calendar_result[i].service_id) continue;
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

// 円周率の定義
var M_PI = 3.14159265359;

// deg を rad に換算する
function m_deg2rad(a){
  return ((a)/180.0 * M_PI);
}

// 緯度・経度から互いの距離を求める関数
function distansce_from_lon_lat(lat1, lon1, lat2, lon2){
  lon1 = m_deg2rad(Number(lon1));
  lat1 = m_deg2rad(Number(lat1));
  lon2 = m_deg2rad(Number(lon2));
  lat2 = m_deg2rad(Number(lat2));

  let radLonDiff = lon1 - lon2;
  let radLatDiff = lat1 - lat2;

  let radLatAve = (lat1 + lat2) / 2;

  let a = 6378137.0;            //赤道半径
  let b = 6356752.314140356;    // 極半径

  //double e2 = (a*a - b*b) / (a*a);
  let e2 = 0.00669438002301188; // 第一離心率^2
  //double a1e2 = a * (1 - e2);
  let a1e2 = 6335439.32708317; // 赤道上の子午線曲率半径

  let sinLat = Math.sin(radLatAve);
  let w2 = 1.0 - e2 * (sinLat * sinLat);
  let M = a1e2 / (Math.sqrt(w2) * w2); // 子午線曲率半径M
  let N = a / Math.sqrt(w2);

  let t1 = M * radLatDiff;
  let t2 = N * Math.cos(radLatAve) * radLonDiff;
  let dist = Math.sqrt((t1 * t1) + (t2 * t2));
  return dist;
}

exports.aroundstops = functions.https.onRequest((request,response) => {

  // CORS用にAccess-Control-Allow系ヘッダを追加
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  var url = 'https://firebasestorage.googleapis.com/v0/b/[Firebase プロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fstops.json?alt=media';

  const https = require('https');

  https.get(url, function (res) {
    let buf = [];
    res.on('data', function(chunk) {
      buf.push(chunk);
    }).on('end', function() {
      let text   = Buffer.concat(buf);
      let rr = JSON.parse(text);


      let a = [];

      // 抽出処理
      for(let i=0;i<rr.length;i++){
        let r = distansce_from_lon_lat(request.query.lat, request.query.lon, rr[i].stop_lat, rr[i].stop_lon);
        if(r>request.query.distance) continue;
        rr[i].distance = r;
        a.push(rr[i]);
      }

      // ソート処理
      for(let i=0;i<a.length;i++){
        for(let j=i+1;j<a.length;j++){
          if(a[i].distance<a[j].distance) continue;
          let t = a[i];
          a[i]=a[j];
          a[j]=t;
        }
      }

      // 出力処理
      response.send(JSON.stringify(a));
      return;
//      response.send(JSON.stringify(a));
//      return;
    });
  });
  return;
}); 