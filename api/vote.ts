import express, { query } from "express";
import { conn } from "../dbconnect";


// router = ตัวจัดการเส้นทาง
export const router = express.Router();

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

// นับโหวต
router.get("/count", (req, res)=>{
    const id = req.query.mid as string;
    // ดึงค่าปัจจุบันของ vote_count จากฐานข้อมูล
    console.log(id);
    const getSql = "SELECT vote_count FROM vote WHERE mid = ?";
    conn.query(getSql, [id], (err, result) => {
        if (err) {
            res.status(400).json(err);
        } else {
            if (result.length > 0) {
                const currentVoteCount = result[0].vote_count;
                
                // อัปเดตค่า vote_count ในฐานข้อมูลโดยเพิ่มขึ้นอีก 1
                // const updateSql = "UPDATE vote SET vote_count = ?, date = ? WHERE mid = ?";
                const updateSql = "UPDATE vote SET vote_count = ? , date = DATE(NOW()) WHERE mid = ?";

                // const today: Date = new Date();
                // const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };
                // const formattedDate: string = today.toLocaleDateString('en-US', options);
                // const currentDate = new Date().toISOString(); // ใช้เวลาปัจจุบันในรูปแบบ ISO string
                conn.query(updateSql, [currentVoteCount+1 , id], (err, result) => {
                    if (err) {
                        res.status(400).json(err);
                    } else {
                        res.json({ message: "Vote count updated successfully" });
                    }
                });                
            } else {
                res.status(404).json({ message: "Image not found" });
            }
        }
    });
});

router.get("/test", (req, res)=>{
    const today: Date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };
    const formattedDate: string = today.toLocaleDateString('en-US', options);
    // const formattedDate: string = today.toLocaleDateString('th-TH', options);
    
    res.json(formattedDate);
    
});

// ระบบ elo rating
router.post("/", (req, res) => {
    let details = {
        mid1: req.body.mid1,
        mid2: req.body.mid2,
        win: req.body.win,
    };
    if (details.win == details.mid1) {
        const sqlCheck = 'SELECT rating FROM vote WHERE mid = ? OR mid = ?';
        conn.query(sqlCheck, [details.mid1, details.mid2], (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
               
                if (result.length >= 2) {
                    let player1Rating = result[0].rating;
                    let player2Rating = result[1].rating;
                    // console.log(result[0].rating);
                    // let player1Rating = 3000;
                    // let player2Rating = 2600;
                    // คำนวณคะแนน ELO rating ใหม่
                    let eloChangeWinner = calculateEloRatingWin(player1Rating, player2Rating);
                    let eloChangeLoser = calculateEloRatingLost(player1Rating, player2Rating);
                    // console.log(eloChangeWinner)
                    // console.log(eloChangeLoser)
                    let player1NewRating = Math.round(player1Rating + eloChangeWinner);
                    let player2NewRating = Math.round(player2Rating + eloChangeLoser);
                    console.log(eloChangeLoser);
                    const sqlUpdateMid1 = "UPDATE vote SET rating = ? WHERE mid = ?";
                    const sqlUpdateMid2 = "UPDATE vote SET rating = ? WHERE mid = ?";

                    // Update mid1
                    conn.query(sqlUpdateMid1, [player1NewRating, details.mid1], (errorMid1, resultMid1) => {
                        if (errorMid1) {
                            res.status(400).json({ status: false, message: "Failed to update ratings for mid1gg", error: errorMid1 });
                        } else {
                            // Update mid2
                            conn.query(sqlUpdateMid2, [player2NewRating, details.mid2], (errorMid2, resultMid2) => {
                                if (errorMid2) {
                                    res.status(400).json({ status: false, message: "Failed to update ratings for mid2", error: errorMid2 });
                                } else {
                                    res.json({ status: true, message: "Ratings updated successfully for both mid1 and mid2" ,
                                    eloChangeWinner: player1NewRating ,
                                    eloWin: eloChangeWinner,
                                    eloChangeLoser: player2NewRating,
                                    eloLost: eloChangeLoser,
                                });
                                }
                            });
                        }
                    });

                } else {
                    res.status(404).json({ status: false, message: "Insufficient data for both players" });
                }
            }
        });
    }

    else if (details.win == details.mid2) {
        const sqlCheck = 'SELECT rating FROM vote WHERE mid = ? OR mid = ?';
        conn.query(sqlCheck, [details.mid2, details.mid1], (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
                if (result.length >= 2) {
                    let player1Rating = result[1].rating;
                    let player2Rating = result[0].rating;
                    // คำนวณคะแนน ELO rating ใหม่
                    let eloChangeWinner = calculateEloRatingWin(player1Rating, player2Rating);
                    let eloChangeLoser = calculateEloRatingLost(player1Rating, player2Rating);

                    let player1NewRating = Math.round(player1Rating + eloChangeWinner);
                    let player2NewRating = Math.round(player2Rating + eloChangeLoser);

                    const sqlUpdateMid1 = "UPDATE vote SET rating = ? WHERE mid = ?";
                    const sqlUpdateMid2 = "UPDATE vote SET rating = ? WHERE mid = ?";
    
                    // Update mid1
                    conn.query(sqlUpdateMid1, [player1NewRating, details.mid2], (errorMid1, resultMid1) => { // เราสลับค่า details.mid1 และ details.mid2
                        if (errorMid1) {
                            res.status(400).json({ status: false, message: "Failed to update ratings for mid1", error: errorMid1 });
                        } else {
                            // Update mid2
                            conn.query(sqlUpdateMid2, [player2NewRating, details.mid1], (errorMid2, resultMid2) => { // เราสลับค่า details.mid1 และ details.mid2
                                if (errorMid2) {
                                    res.status(400).json({ status: false, message: "Failed to update ratings for mid2", error: errorMid2 });
                                } else {
                                    res.json({ status: true, 
                                        message: "Ratings updated successfully for both mid1 and mid2" ,
                                        eloChangeWinner: player1NewRating ,
                                        eloWin: eloChangeWinner,
                                        eloChangeLoser: player2NewRating,
                                        eloLost: eloChangeLoser,
                                    });
                                }
                            });
                        }
                    });
    
                } else {
                    res.status(404).json({ status: false, message: "Insufficient data for both players" });
                }
            }
        });
    }
    
});

function calculateEloRatingWin(ra: number, rb: number) {
    const kFactor = 32;
    const expectedScoreA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
    console.log(expectedScoreA);
    const eloChangeWin = kFactor * (1 - expectedScoreA); // ไม่ต้องลบ (ra - rb) / 2 ออก
    // console.log(eloChangeWin);
    return eloChangeWin;
}

function calculateEloRatingLost(ra: number, rb: number) {
    const kFactor = 32;
    const expectedScorel = 1 / (1 + Math.pow(10, (ra - rb) / 400));
    console.log(expectedScorel);
    const eloChangeLost = kFactor * (0 - expectedScorel) 
    // console.log(eloChangeLost);
    return eloChangeLost;
}
