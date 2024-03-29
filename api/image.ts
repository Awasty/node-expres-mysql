import express, { query } from "express";
import { conn } from "../dbconnect";

// router = ตัวจัดการเส้นทาง
export const router = express.Router();
router.use(express.json());

router.use(express.urlencoded({ extended: true }));
// สุ่มรูปภาพไม่ซ้ำหน้าโหวต
router.get("/pic/random", (req, res) => {
    if (req.query.id) {
        const id = req.query.id;
        const name = req.query.name;
        res.send("Method GET in image.ts with" + id);
    } else {
        const sql = 'select * from image';
        conn.query(sql, (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
                const images = result.map((item: any) => item.mid); // ดึง mid ทั้งหมดจากผลลัพธ์ของคำสั่ง SQL
                let randomMid1 = getRandomMid(images); // สุ่ม mid ครั้งแรก
                let randomMid2 = getRandomMid(images); // สุ่ม mid ครั้งที่สอง

                // ตรวจสอบและสุ่มใหม่ถ้า mid ซ้ำกัน
                while (randomMid1 === randomMid2) {
                    randomMid2 = getRandomMid(images);
                }

                // Query ข้อมูลของ randomMid1 และ randomMid2 พร้อมกัน
                const sqlQuery = 'SELECT image.*, vote.rating FROM image JOIN vote ON image.mid = vote.mid WHERE image.mid = ? OR image.mid = ?';
                conn.query(sqlQuery, [randomMid1, randomMid2], (err, combinedResult) => {
                    if (err) {
                        res.status(400).json(err);
                    } else {
                        // สร้าง JSON object ที่มีข้อมูลของทั้ง randomMid1 และ randomMid2
                        const response = {
                            0: combinedResult.find((item: any) => item.mid === randomMid1),
                            1: combinedResult.find((item: any) => item.mid === randomMid2)
                        };
                        res.json(response); // ส่งผลลัพธ์กลับ
                    }
                });
            }
        })
    }
});

function getRandomMid(images: any[]) {
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
}

router.post("/addImage", (req, res) => {
    console.log('Request body:', req.body); // แสดงค่า request body ที่ได้รับมาใน console

    let details = {
        uid: req.body.uid,
        url: req.body.url,
    };

    if (!details.uid || !details.url) {
        return res.status(400).json({ error: "UID and URL are required." });
    }

    const sqlCount = 'SELECT COUNT(*) AS count FROM image WHERE uid = ?';
    conn.query(sqlCount, [details.uid], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error." });
        }

        const count = result[0].count;

        if (count >= 5) {
            return res.status(400).json({ error: "Maximum number of records reached for this UID." });
        }

        const sqlInsertImage = 'INSERT INTO image (uid, url) VALUES (?, ?)';
        conn.query(sqlInsertImage, [details.uid, details.url], (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Failed to insert data into database." });
            }

            // หลังจาก insert ข้อมูลลงในตาราง image เรียบร้อยแล้ว
            // ดึง mid ล่าสุดจากตาราง image
            const sqlGetLatestMid = 'SELECT MAX(mid) AS latestMid FROM image';
            conn.query(sqlGetLatestMid, (err, rows) => {
                if (err) {
                    return res.status(500).json({ error: "Failed to retrieve latest mid from database." });
                }

                const latestMid = rows[0].latestMid;

                // ทำการ insert ข้อมูลลงในตาราง vote โดยใช้ latestMid ที่ได้จากตาราง image
                const sqlInsertVote = 'INSERT INTO vote (mid, vid, date) VALUES (?, ?, DATE(NOW()))';
                conn.query(sqlInsertVote, [latestMid,latestMid], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: "Failed to insert data into vote table." });
                    }

                    // ส่งคำตอบกลับไปยัง Client เมื่อเพิ่มข้อมูลเข้าสู่ฐานข้อมูลเรียบร้อยแล้ว
                    res.status(200).json({ message: "Data inserted successfully." });
                });
            });
        });

    });
});



router.get("/", (req, res) => {
    if (req.query.uid) {
        const uid = req.query.uid;

        const sql = 'SELECT image.*, vote.rating FROM image JOIN vote ON image.mid = vote.mid WHERE image.uid = ?';

        conn.query(sql, [uid], (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
                res.json(result);
                // console.log(5)
            }
        });
    } else {
        res.status(400).send("UID parameter is required.d");
    }
});





