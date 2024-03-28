import express, { query } from "express";
import { conn } from "../dbconnect";


// router = ตัวจัดการเส้นทาง
export const router = express.Router();

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

// โชว์หมด
router.get("/", (req, res)=>{
    if (req.query.id) {
        const id = req.query.id;
        const name = req.query.name;
        res.send("Method GET in user.ts with" + id);
    }else{
      const sql = 'select * from user';
      conn.query(sql, (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
      })
    }
});

// Register
router.post("/add", (req, res) => {
    let details = {
      user: req.body.user,
      email: req.body.email,
      password: req.body.password,

    };
    let sql = "INSERT INTO user SET ?";
    conn.query(sql, details, (error) => {
      if (error) {
        res.send({ status: false, message: "Register created Failed" });
      } else {
        res.send({ status: true, message: "Register created successfully" });
      }
    });
  });

  //Login
  router.post("/check", (req, res) => {
    let details = {
        email: req.body.email,
        password: req.body.password,
    };
    const sql = "SELECT * FROM user WHERE email = ? AND password = ?";

    conn.query(sql, [details.email, details.password], (error, result) => {
        if (error) {
            res.status(400).json({ status: false, message: "Login created Failed", error: error });
        } else {
            res.json(result);
        }
    });
});

router.get("/checkedit", (req, res)=>{
  if (req.query.id) {
      const id = req.query.id;
      const name = req.query.name;
      res.send("Method GET in user.ts with" + id);
  }else{
    const sql = 'select * from user';
    conn.query(sql, (err,result)=>{
      if (err) {
          res.status(400).json(err);
      } else {
          res.json(result);
      }
    })
  }
});

//Edit
router.get("/selectEdit", (req, res) => {
  const uid = req.query.uid; // เข้าถึงค่า uid จาก query parameter ชื่อ uid
  const sql = "SELECT * FROM user WHERE user_type = ? AND uid = ?";

  conn.query(sql, ["user", uid], (error, result) => {
      if (error) {
          res.status(400).json({ status: false, message: "Cuss eid", error: error });
      } else {
          res.json(result);
      }
  });
});

router.post("/edit", (req, res) => {
  let details = {
    uid: req.body.uid,
    user: req.body.user,
    email: req.body.email,
    password: req.body.password,
    profile: req.body.profile,
  } as { [key: string]: any };

  let condition = { uid: details.uid }; // เปลี่ยนเป็นเงื่อนไขที่ต้องการในการ update

  let sql = "UPDATE user SET";
  let updates = [];
  for (const key in details) {
    if (details.hasOwnProperty(key)) {
      if (details[key] !== null && details[key] !== undefined && details[key] !== "") {
        updates.push(`${key} = '${details[key]}'`);
      }
    }
  }
  sql += " " + updates.join(", ") + " WHERE ?";

  conn.query(sql, [condition], (error, results) => {
    if (error) {
      res.send({ status: false, message: "Update failed", error: error });
    } else {
      // res.send({ status: true, message: "Update successfully", data: results });
      const sql = "SELECT * FROM user WHERE user_type = ? AND uid = ?";

      conn.query(sql, ["user", details.uid], (error, result) => {
          if (error) {
              res.status(400).json({ status: false, message: "Cuss eid", error: error });
          } else {
              res.json(result);
          }
      });
    }
  });
});

