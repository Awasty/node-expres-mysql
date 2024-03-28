import express, { query } from "express";
import { conn } from "../dbconnect";

// router = ตัวจัดการเส้นทาง
export const router = express.Router();

// สุ่มรูปภาพไม่ซ้ำหน้าโหวต
router.get("/pic/random", (req, res)=>{
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



