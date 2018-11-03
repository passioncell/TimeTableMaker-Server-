const express = require('express');
const router = express.Router();
const dbConnection = require('../dbConnection');
const SUBJECT_LIMIT_COUNT=3;
const days = {0:"월요일", 1:"화요일", 2:"수요일", 3:"목요일", 4:"금요일"};
const times = {0:"1교시", 1:"2교시", 2:"3교시", 3:"4교시", 4:"5교시", 5:"6교시", 6:"7교시", 7:"8교시"};


router.get('/api/subjects', (req, res) => {
  /*
    과목 데이터를 join하여 json형태로 리턴
  */
  let sql = `
      SELECT s.id as subjectId, s.title, s.grade, s.color, l.day, l.time
      FROM Subject as s
      LEFT JOIN Lesson as l ON s.id = l.subjectId
      WHERE s.isEnable = 1
      ORDER BY title ASC
  `;

  dbConnection.query(sql, (err, rows, fields)=>{
    if(err){
      console.error(err);
      return res.status(500).json({result:"error", message:err});
    }

    if(rows.length<=0){
      return res.status(204).json({result:"error", message:"empty data"});
    }

    let subjectList=[];
    let prevSubjectId = rows[0].subjectId;
    let resultSubject = {
      subjectId: prevSubjectId,
      title: null,
      grade: null,
      color: null,
      lesson:[]
    };

    rows.forEach((row, index)=>{
      let currentSubjectId = row.subjectId;
      if(currentSubjectId === prevSubjectId){
        // 이전 루프와 동일한 과목 작업을 수행한다면
        if((index+1)%SUBJECT_LIMIT_COUNT===0){
          resultSubject.title = row.title;
          resultSubject.grade = row.grade;
          resultSubject.color = row.color;
        }
        let days = row.day.split(",");
        let times = row.time.split(",");

        let lessonElement = [];
        days.forEach((e,i)=>{
            let timeInnerArray = [];
            timeInnerArray.push(times[0]-1);
            times.splice(0, 1);
            timeInnerArray.push(times[0]-1);
            times.splice(0, 1);
            let lessonInnerElement = {day:e-1, time:timeInnerArray};
            lessonElement.push(lessonInnerElement);
        });
        resultSubject.lesson.push(lessonElement);
        if((index+1)%SUBJECT_LIMIT_COUNT===0){
          subjectList.push(resultSubject);
        }
      }
      else{
        // 이전 루프와 다른 과목 작업을 수행한다면
        resultSubject = {
          subjectId : currentSubjectId,
          title: null,
          grade: null,
          color: null,
          lesson: []
        };
        prevSubjectId = currentSubjectId;
      }
    }); //forEach();
    // 전체 과목 데이터 반환
    return res.status(200).json(subjectList);
  })
});

router.get('/api/subjects-guide', (req, res) => {
  let sql = `
    SELECT s.id as subjectId, s.title, s.grade, l.day, l.time
    FROM Subject as s
    LEFT JOIN Lesson as l ON s.id = l.subjectId
    WHERE s.isEnable = 1
    ORDER BY title ASC
  `;

  dbConnection.query(sql, (error, rows, fields) => {
    if(error){
      console.error(error);
      return res.status(500).json({result:"error", message:error});
    }

    if(rows.length<=0){
      return res.status(204).json({result:"error", message:"empty data"});
    }

    let resultGuideList = [];

    rows.forEach((e,i) => {

      // 요일 변환
      let transformedDay = "";
      let splitedDay = e.day.split(",");
      splitedDay.forEach((e2,i2) => {
        transformedDay = transformedDay.concat(days[e2-1]);
        if(splitedDay.length-1>i2){
          transformedDay = transformedDay.concat(",");
        }
      });
      rows[i].day = transformedDay;

      // 시간 변환
      let transformedTime = "";
      let splitedTime = e.time.split(",");
      splitedTime.forEach((e2,i2) => {
        transformedTime = transformedTime.concat(times[e2-1]);
        if(i2%2===0){
          transformedTime = transformedTime.concat("~");
        }
        else if(i2%2===1 && splitedTime.length-1 !== i2){
          transformedTime = transformedTime.concat(",")
        }
        else{

        }
      });
      rows[i].time = transformedTime;


      // 요일과 시간 병합
      splitedDay = rows[i].day.split(",");
      splitedTime = rows[i].time.split(",");
      let dayAndTime = ""
      for(let j=0; j<splitedDay.length; j++){
        dayAndTime = dayAndTime.concat(splitedDay[j]).concat("(").concat(splitedTime[j]).concat(")");
        if(j===0 && splitedDay.length-1 > j){
          dayAndTime = dayAndTime.concat(",");
        }
      }

      // 최종 가이드 리스트에 정제된 항목 추가
      let guideItem = {
        subjectId: e.subjectId,
        title: e.title,
        grade: e.grade,
        dayAndTime
      };

      resultGuideList.push(guideItem);
    })

    return res.status(200).json(resultGuideList);
  });
});


module.exports = router;
