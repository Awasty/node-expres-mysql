import express, { query } from "express";
import { conn } from "../dbconnect";



export const router = express.Router();

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

// โชว์ 10 อันดับ มาก ไป น้อย
router.get("/top10", (req, res)=>{
    if (req.query.id) {
        const id = req.query.id;
        const name = req.query.name;
        res.send("Method GET in user.ts with" + id);
    }else{
      const sql = 'select vote.rating ,image.* from vote join image on vote.mid = image.mid ORDER BY vote.rating DESC;';
      conn.query(sql, (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
      })
    }
});

// โชว์ 10 อันดับ มาก ไป น้อย
router.get("/7day", (req, res)=>{
  if (req.query.id) {
      const id = req.query.id;
      const name = req.query.name;
      res.send("Method GET in user.ts with" + id);
  }else{
    const sql = `
    SELECT vote.rating, image.*
    FROM vote
    JOIN image ON vote.mid = image.mid
    WHERE vote.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    ORDER BY vote.rating DESC;
    `;
    conn.query(sql, (err,result)=>{
      if (err) {
          res.status(400).json(err);
      } else {
          res.json(result);
      }
    })
  }
});














