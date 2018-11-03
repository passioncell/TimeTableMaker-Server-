const express = require('express');
const router = express.Router();
const dbConnection = require('../dbConnection');
const SUBJECT_LIMIT_COUNT=3;

router.get('/api/subjects', function(req, res, next) {
  /*
    과목 데이터를 join하여 json형태로 리턴
  */
  let query = `
      SELECT s.id as subjectId, s.title, s.grade, s.color, l.day, l.time
      FROM Subject as s
      LEFT JOIN Lesson as l ON s.id = l.subjectId
      WHERE s.isEnable = 1
      ORDER BY title ASC
  `;

  dbConnection.query(query, (err, rows, fields)=>{
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

module.exports = router;
